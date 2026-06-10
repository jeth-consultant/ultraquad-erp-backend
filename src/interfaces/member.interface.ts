export interface Member {
  id: number;
  member_code: string;
  name: string;
  phone: string;
  email: string | null;
  password_hash: string;
  github_username: string | null;
  role: 'member' | 'admin';
  created_at: Date;
}

export type PublicMember = Omit<Member, 'password_hash'>;

export function toPublicMember(member: Member): PublicMember {
  const { password_hash: _passwordHash, ...rest } = member;
  return rest;
}
