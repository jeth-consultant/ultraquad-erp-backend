import * as contributionsRepository from '../repositories/contributions.repository';

export async function listMyContributions(memberId: number, limit: number, offset: number) {
  return contributionsRepository.findByMember(memberId, limit, offset);
}
