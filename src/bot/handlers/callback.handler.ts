/**
 * Callback handler - processes inline button callbacks
 */

import TelegramBot, { CallbackQuery } from 'node-telegram-bot-api';
import { Pool } from 'pg';
import { GamePlayerRepository } from '../../database/repositories/gamePlayer.repository';
import { GameRepository } from '../../database/repositories/game.repository';
import { JokeRepository } from '../../database/repositories/joke.repository';
import { JokeType } from '../../types/admin.types';
import { declineRussian } from '../../utils/declension';

export class CallbackHandler {
  private gamePlayerRepository: GamePlayerRepository;
  private gameRepository: GameRepository;
  private jokeRepository: JokeRepository;

  constructor(pool: Pool, private bot: TelegramBot) {
    this.gamePlayerRepository = new GamePlayerRepository(pool);
    this.gameRepository = new GameRepository(pool);
    this.jokeRepository = new JokeRepository(pool);
  }

  /**
   * Handle callback queries
   */
  async handleCallbackQuery(query: CallbackQuery): Promise<void> {
    const data = query.data || '';
    const user = query.from;
    const message = query.message;
    const chatId = message?.chat.id;

    if (!chatId) return;

    try {
      if (data.startsWith('appointment_')) {
        await this.handleAppointment(query, chatId, user.id);
      } else if (data.startsWith('notconfirmed_')) {
        await this.handleNotConfirmed(query, chatId, user.id);
      } else if (data.startsWith('decline_')) {
        await this.handleDecline(query, chatId, user.id);
      } else if (data.startsWith('privateAppointment_')) {
        await this.handlePrivateAppointment(query, user.id);
      } else if (data.startsWith('privateNotconfirmed_')) {
        await this.handlePrivateNotConfirmed(query, user.id);
      } else if (data.startsWith('privateDecline_')) {
        await this.handlePrivateDecline(query, user.id);
      } else if (data.startsWith('deactivegame_')) {
        await this.handleDeactivateGame(query, chatId);
      }
      // Add more callback handlers as needed
    } catch (error) {
      console.error('Callback handling error:', error);
    }
  }

  private async handleAppointment(query: CallbackQuery, chatId: number, userId: number): Promise<void> {
    const gameId = parseInt(query.data?.replace('appointment_', '') || '0');
    const username = query.from.username;

    const status = await this.gameRepository.checkGameStatus(gameId);
    if (!status) {
      await this.bot.sendMessage(chatId, `@${username} куда ты прёшь? Игра закрыта!`);
      return;
    }

    const label = await this.gamePlayerRepository.addGamePlayerById({
      gameId,
      chatId,
      userId,
      confirmed_attendance: true,
    });

    if (label) {
      await this.bot.sendMessage(chatId, `@${username} вы записались на ${declineRussian(label, 'винительный')}!`);
    }
  }

  private async handleNotConfirmed(query: CallbackQuery, chatId: number, userId: number): Promise<void> {
    const gameId = parseInt(query.data?.replace('notconfirmed_', '') || '0');
    const username = query.from.username;

    const label = await this.gamePlayerRepository.addGamePlayerById({
      gameId,
      chatId,
      userId,
      confirmed_attendance: false,
    });

    if (label) {
      await this.bot.sendMessage(chatId, `@${username} вы записались на ${declineRussian(label, 'винительный')}! Но это не точно 😒`);
    }
  }

  private async handleDecline(query: CallbackQuery, chatId: number, userId: number): Promise<void> {
    const gameId = parseInt(query.data?.replace('decline_', '') || '0');
    const username = query.from.username;

    const label = await this.gamePlayerRepository.removeGamePlayerById(gameId, userId);

    if (label) {
      const joke = await this.jokeRepository.getJoke(JokeType.LEFT_GAME);
      await this.bot.sendMessage(chatId, `@${username} удирает с игры на ${declineRussian(label, 'винительный')}. ${joke}`);
    }
  }

  private async handlePrivateAppointment(query: CallbackQuery, userId: number): Promise<void> {
    const parts = query.data?.split('_') || [];
    const chatId = parseInt(parts[1] || '0');
    const gameId = parseInt(parts[2] || '0');
    const username = query.from.username;

    const status = await this.gameRepository.checkGameStatus(gameId);
    if (!status) {
      await this.bot.sendMessage(chatId, `@${username} куда ты прёшь? Игра закрыта!`);
      return;
    }

    const label = await this.gamePlayerRepository.addGamePlayerById({
      gameId,
      chatId,
      userId,
      confirmed_attendance: true,
    });

    if (label) {
      await this.bot.sendMessage(chatId, `@${username} вы записались на ${declineRussian(label, 'винительный')}!`);
    }
  }

  private async handlePrivateNotConfirmed(query: CallbackQuery, userId: number): Promise<void> {
    const parts = query.data?.split('_') || [];
    const chatId = parseInt(parts[1] || '0');
    const gameId = parseInt(parts[2] || '0');
    const username = query.from.username;

    const label = await this.gamePlayerRepository.addGamePlayerById({
      gameId,
      chatId,
      userId,
      confirmed_attendance: false,
    });

    if (label) {
      await this.bot.sendMessage(chatId, `@${username} вы записались на ${declineRussian(label, 'винительный')}! Но это не точно 😒`);
    }
  }

  private async handlePrivateDecline(query: CallbackQuery, userId: number): Promise<void> {
    const parts = query.data?.split('_') || [];
    const chatId = parseInt(parts[1] || '0');
    const gameId = parseInt(parts[2] || '0');
    const username = query.from.username;

    const label = await this.gamePlayerRepository.removeGamePlayerById(gameId, userId);

    if (label) {
      await this.bot.sendMessage(chatId, `@${username} удирает с игры на ${declineRussian(label, 'винительный')}. Бейте предателя! 😡`);
    }
  }

  private async handleDeactivateGame(query: CallbackQuery, chatId: number): Promise<void> {
    const gameId = parseInt(query.data?.replace('deactivegame_', '') || '0');

    const label = await this.gameRepository.deactivateGame(gameId);

    if (label) {
      await this.bot.sendMessage(chatId, `Игра на ${declineRussian(label, 'винительный')} закрыта!`);
    }
  }
}
