import AppError from '../errors/AppError';
import { getCustomRepository, getRepository } from 'typeorm';

import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';

import CreateCategory from '../services/CreateCategory';

interface TransactioObject {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: TransactioObject): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoryRepository = getRepository(Category);

    const balance = await transactionsRepository.getBalance();

    if (type === 'outcome' && value > balance.income)
      throw new AppError(
        'O valor solicitado é maior que o disponível na conta',
      );

    let existCategory = await categoryRepository.findOne({
      where: {
        title: category,
      },
    });

    if (!existCategory) {
      const createCategory = new CreateCategory();

      existCategory = await createCategory.execute(category);
    }

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category_id: existCategory.id,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
