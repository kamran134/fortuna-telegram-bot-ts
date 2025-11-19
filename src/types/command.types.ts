/**
 * Command types and interfaces
 */

import TelegramBot, { Message } from 'node-telegram-bot-api';
import { Pool } from 'pg';
import { GameService } from '../services/game.service';
import { UserService } from '../services/user.service';
import { AdminGroupService } from '../services/adminGroup.service';
import { JokeRepository } from '../database/repositories/joke.repository';

export interface CommandContext {
  message: Message;
  chatId: number;
  userId: number;
  user: Message['from'];
  messageText: string;
  text: string; // Alias for messageText for convenience
  isAdmin: boolean;
  isCreator: boolean;
  messageThreadId?: number;
  bot: TelegramBot;
  pool: Pool;
  // Services
  gameService: GameService;
  userService: UserService;
  adminGroupService: AdminGroupService;
  jokeRepository: JokeRepository;
}

export interface ICommand {
  name: string;
  description?: string;
  adminOnly?: boolean;
  creatorOnly?: boolean;
  execute(context: CommandContext): Promise<void>;
}

export type CommandMatcher = (text: string) => boolean;
