import { ApiError } from '../middleware/errorHandler';
import { toPublicMember } from '../interfaces/member.interface';
import * as profileRepository from '../repositories/profile.repository';

export async function getMe(memberId: number) {
  const member = await profileRepository.findMemberById(memberId);
  if (!member) {
    throw new ApiError(404, 'Member not found');
  }
  return toPublicMember(member);
}

export async function updateMe(memberId: number, input: profileRepository.UpdateMemberInput) {
  let member;
  try {
    member = await profileRepository.updateMember(memberId, input);
  } catch (err) {
    if (err instanceof Error && 'code' in err && (err as { code: string }).code === '23505') {
      throw new ApiError(409, 'Email already in use');
    }
    throw err;
  }

  if (!member) {
    throw new ApiError(404, 'Member not found');
  }
  return toPublicMember(member);
}

export async function registerDeviceToken(
  memberId: number,
  token: string,
  platform: 'android' | 'ios',
): Promise<void> {
  await profileRepository.upsertDeviceToken(memberId, token, platform);
}
