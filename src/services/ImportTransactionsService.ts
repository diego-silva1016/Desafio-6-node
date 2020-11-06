import Transaction from '../models/Transaction';
import csvParse from 'csv-parse';
import { getCustomRepository, getRepository, In } from 'typeorm';

import TransactionRepository from '../repositories/TransactionsRepository';
import Category from '../models/Category';

import fs from 'fs'
import { format } from 'prettier';

interface CSVTransaction{
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute(filePath: string): Promise<Transaction[]> {
    const contactsReadStream = fs.createReadStream(filePath);
    const transactionsRepository = getCustomRepository(TransactionRepository);
    const categoryRepository = getRepository(Category);

    const parsers = csvParse({
      from_line: 2,
    });

    const parseCSV = contactsReadStream.pipe(parsers);

    const transactions: CSVTransaction[] = [];
    const categories: string[] = [];

    parseCSV.on('data', async line => {
      const [title, type, value, category] = line.map((cell:string) => cell.trim(),);

      if(!title || !type || !value || !category) return;

      categories.push(category);

      transactions.push({
        title,
        type,
        value,
        category
      })

    });

    await new Promise(resolve => parseCSV.on('end', resolve));

    const formatCategories = categories.filter(function(este,i){
      return categories.indexOf(este) === i;
    });

    const existentCategories = await categoryRepository.find({
      where:{
        title: In(formatCategories),
      }
    });

    const existentCategoriesTitles = existentCategories.map((category:Category) => category.title);

    let newTransactions = [];

    if(existentCategories.length){
      const categoriesTitles = formatCategories.filter(category => !existentCategoriesTitles.includes(category))

      const newCategories = categoryRepository.create(
        categoriesTitles.map(title => ({
          title,
        }))
      )

      await categoryRepository.save(newCategories);

      const categoriesSave = await categoryRepository.find();

     newTransactions = transactionsRepository.create(
        transactions.map(transaction => ({
          title: transaction.title,
          type: transaction.type,
          value: transaction.value,
          category_id: categoriesSave.filter(category => transaction.category === category.title)[0].id
        }))
      )

      await transactionsRepository.save(newTransactions);
    }else{

      const newCategories = categoryRepository.create(
        formatCategories.map(title => ({
          title,
        }))
      )

      await categoryRepository.save(newCategories);

      const categoriesSave = await categoryRepository.find();

     newTransactions = transactionsRepository.create(
        transactions.map(transaction => ({
          title: transaction.title,
          type: transaction.type,
          value: transaction.value,
          category_id: categoriesSave.filter(category => transaction.category === category.title)[0].id
        }))
      )

      await transactionsRepository.save(newTransactions);
    }

    return newTransactions;
  }
}

export default ImportTransactionsService;
