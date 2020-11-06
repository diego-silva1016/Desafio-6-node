import AppError from '../errors/AppError';

import { getCustomRepository } from 'typeorm';

import TransactionsRepository from '../repositories/TransactionsRepository';

class DeleteTransactionService {
  public async execute(id:string): Promise<void> {
      const transactionsRepository = getCustomRepository(TransactionsRepository);

      const existTransaction = await transactionsRepository.findOne({
        where: {id},
      });

      if(!existTransaction)
        throw new AppError("Transação não existe.");

      await transactionsRepository.delete(id);
  }
}

export default DeleteTransactionService;
