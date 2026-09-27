import { Injectable } from '@nestjs/common';
import { UsersRepository, CreateUserData } from './users.repository';
import { User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async create(data: CreateUserData): Promise<User> {
    return this.usersRepository.create(data);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findByEmail(email);
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findById(id);
  }

  async updateLastLogin(id: string): Promise<User> {
    return this.usersRepository.updateLastLogin(id);
  }
}
