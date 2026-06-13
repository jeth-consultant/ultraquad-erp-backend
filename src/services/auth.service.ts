import { AuthPayload } from '../interfaces/auth.interface';
import { ApiError } from '../middleware/errorHandler';
import { Member, toPublicMember } from '../interfaces/member.interface';
import { comparePassword, generateOtp, hashPassword, sha256 } from '../utils/hash';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { sendOtpEmail } from '../utils/email';
import * as authRepository from '../repositories/auth.repository';

const OTP_EXPIRY_MINUTES = 10;

interface RegisterInput {
  name: string;
  phone: string;
  email: string;
  password: string;
  github_username?: string;
}

interface LoginInput {
  email: string;
  password: string;
}

async function issueTokens(member: Pick<Member, 'id' | 'role'>) {
  const payload: AuthPayload = { memberId: member.id, role: member.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  const decoded = verifyRefreshToken(refreshToken) as AuthPayload & { exp: number };
  await authRepository.insertRefreshToken({
    memberId: member.id,
    tokenHash: sha256(refreshToken),
    expiresAtEpochSeconds: decoded.exp,
  });

  return { accessToken, refreshToken };
}

export async function register(input: RegisterInput) {
  const existingPhone = await authRepository.findMemberByPhone(input.phone);
  if (existingPhone) {
    throw new ApiError(409, 'Phone number already registered');
  }

  const existingEmail = await authRepository.findMemberByEmail(input.email);
  if (existingEmail) {
    throw new ApiError(409, 'Email already registered');
  }

  const memberCode = await authRepository.nextMemberCode();
  const passwordHash = await hashPassword(input.password);

  const member = await authRepository.createMember({
    memberCode,
    name: input.name,
    phone: input.phone,
    email: input.email,
    passwordHash,
    githubUsername: input.github_username ?? null,
  });

  const tokens = await issueTokens(member);

  return { member: toPublicMember(member), ...tokens };
}

export async function login(input: LoginInput) {
  const member = await authRepository.findMemberByEmail(input.email);

  if (!member || !(await comparePassword(input.password, member.password_hash))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const tokens = await issueTokens(member);

  return { member: toPublicMember(member), ...tokens };
}

export async function refresh(refreshToken: string) {
  let payload: AuthPayload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  const tokenHash = sha256(refreshToken);
  const stored = await authRepository.findRefreshToken(payload.memberId, tokenHash);

  if (!stored || stored.expires_at < new Date()) {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  if (stored.revoked_at) {
    // Reuse of an already-rotated token: revoke all sessions for this member.
    await authRepository.revokeAllRefreshTokens(payload.memberId);
    throw new ApiError(401, 'Refresh token has already been used');
  }

  await authRepository.revokeRefreshTokenById(stored.id);

  return issueTokens({ id: payload.memberId, role: payload.role });
}

export async function logout(refreshToken: string): Promise<void> {
  await authRepository.revokeRefreshTokenByHash(sha256(refreshToken));
}

export async function forgotPassword(email: string): Promise<void> {
  const member = await authRepository.findMemberByEmail(email);
  if (!member) {
    return;
  }

  const otp = generateOtp();
  const expiresAt = Math.floor(Date.now() / 1000) + OTP_EXPIRY_MINUTES * 60;

  await authRepository.invalidatePasswordResetOtps(member.id);
  await authRepository.insertPasswordResetOtp({
    memberId: member.id,
    otpHash: sha256(otp),
    expiresAtEpochSeconds: expiresAt,
  });

  await sendOtpEmail(member.email, member.name, otp, OTP_EXPIRY_MINUTES);
}

export async function sendOtp(email: string): Promise<void> {
  return forgotPassword(email);
}

export async function verifyOtp(email: string, otp: string): Promise<void> {
  const member = await authRepository.findMemberByEmail(email);
  if (!member) {
    throw new ApiError(400, 'Invalid or expired OTP');
  }

  const stored = await authRepository.findValidPasswordResetOtp(member.id, sha256(otp));
  if (!stored || stored.used_at || stored.expires_at < new Date()) {
    throw new ApiError(400, 'Invalid or expired OTP');
  }
}

export async function resetPassword(email: string, otp: string, newPassword: string): Promise<void> {
  const member = await authRepository.findMemberByEmail(email);
  if (!member) {
    throw new ApiError(400, 'Invalid or expired OTP');
  }

  const stored = await authRepository.findValidPasswordResetOtp(member.id, sha256(otp));
  if (!stored || stored.used_at || stored.expires_at < new Date()) {
    throw new ApiError(400, 'Invalid or expired OTP');
  }

  const passwordHash = await hashPassword(newPassword);
  await authRepository.updateMemberPassword(member.id, passwordHash);
  await authRepository.markPasswordResetOtpUsed(stored.id);
  await authRepository.revokeAllRefreshTokens(member.id);
}
