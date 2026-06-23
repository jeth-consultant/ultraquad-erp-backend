export interface AuthPayload {
  memberId: number;
  role: 'member' | 'admin';
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
}
