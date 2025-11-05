/**
 * User service - business logic for user operations
 */

import { UserRepository } from '../database/repositories/user.repository';
import { JokeRepository } from '../database/repositories/joke.repository';
import { CreateUserDto } from '../types/user.types';
import { JokeType } from '../types/admin.types';
import { tagUsers, listUsers } from '../utils/formatter';
import { Messages } from '../constants/messages';

export class UserService {
  constructor(
    private userRepository: UserRepository,
    private jokeRepository: JokeRepository
  ) {}

  /**
   * Register a new user
   */
  async registerUser(dto: CreateUserDto): Promise<string> {
    try {
      return await this.userRepository.addUser(dto);
    } catch (error) {
      console.error('USER SERVICE - REGISTER ERROR:', error);
      return Messages.ERROR_OCCURRED;
    }
  }

  /**
   * Get registered users (tagged or listed)
   */
  async getRegisteredUsers(chatId: number, format: 'tag' | 'show', isAdmin: boolean): Promise<string> {
    if (!isAdmin) {
      try {
        const joke = await this.jokeRepository.getJoke(JokeType.TAG_REGISTERED);
        return `Только одмэн может массово беспокоить всех! ${joke}`;
      } catch {
        return 'Только одмэн может массово беспокоить всех!';
      }
    }

    try {
      const users = await this.userRepository.getUsers(chatId);

      if (!users || users.length === 0) {
        return Messages.NO_REGISTERED_USERS;
      }

      const usersString = format === 'tag' ? tagUsers(users) : listUsers(users);
      return 'Qeydiyyatdan keçmiş iştirakçılar\nЗарегистрированные участники:\n\n' + usersString;
    } catch (error) {
      console.error('USER SERVICE - GET REGISTERED ERROR:', error);
      return Messages.ERROR_OCCURRED;
    }
  }

  /**
   * Get random user for "Ağıllı ol" command
   */
  async getRandomUserMessage(chatId: number): Promise<string> {
    try {
      const randomUser = await this.userRepository.getRandomUser(chatId);

      if (!randomUser) {
        return 'Печально, когда некому говорить "Ağıllı ol" 🥲';
      }

      if (randomUser.username) {
        return `@${randomUser.username}, ağıllı ol! 🧠`;
      }
      return `<a href="tg://user?id=${randomUser.user_id}">${randomUser.first_name}</a>, ağıllı ol! 🧠`;
    } catch (error) {
      console.error('USER SERVICE - RANDOM USER ERROR:', error);
      return Messages.ERROR_OCCURRED;
    }
  }

  /**
   * Get inactive users
   */
  async getInactiveUsersMessage(chatId: number): Promise<string> {
    try {
      const users = await this.userRepository.getInactiveUsers(chatId);

      if (!users || users.length === 0) {
        return 'Все активные, молодцы! 👏';
      }

      const usersString = tagUsers(users);
      return 'Значит так, \n\n' + usersString + '\n\nпочему не посещаем игры? Бот негодуэ 🤨';
    } catch (error) {
      console.error('USER SERVICE - INACTIVE USERS ERROR:', error);
      return Messages.ERROR_OCCURRED;
    }
  }
}
