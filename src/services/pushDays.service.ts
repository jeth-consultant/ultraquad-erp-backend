import * as pushDaysRepository from '../repositories/pushDays.repository';

export async function listMyPushDays(memberId: number, limit: number, offset: number) {
  return pushDaysRepository.findByMember(memberId, limit, offset);
}
