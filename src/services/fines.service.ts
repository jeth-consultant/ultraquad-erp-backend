import { Fine } from '../interfaces/payment.interface';
import * as finesRepository from '../repositories/fines.repository';

export async function listMyFines(memberId: number, status?: Fine['status']) {
  return finesRepository.findByMember(memberId, status);
}
