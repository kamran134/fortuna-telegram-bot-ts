/**
 * Callback handler - processes inline button callbacks
 */

import TelegramBot, { CallbackQuery } from 'node-telegram-bot-api';
import { Pool } from 'pg';
import { GamePlayerRepository } from '../../database/repositories/gamePlayer.repository';
import { GameRepository } from '../../database/repositories/game.repository';
import { JokeRepository } from '../../database/repositories/joke.repository';
import { AdminGroupRepository } from '../../database/repositories/adminGroup.repository';
import { UserRepository } from '../../database/repositories/user.repository';
import { JokeType } from '../../types/admin.types';
import { Game } from '../../types/game.types';
import { User } from '../../types/user.types';
import { declineRussian } from '../../utils/declension';

export class CallbackHandler {
  private gamePlayerRepository: GamePlayerRepository;
  private gameRepository: GameRepository;
  private jokeRepository: JokeRepository;
  private adminGroupRepository: AdminGroupRepository;
  private userRepository: UserRepository;

  constructor(pool: Pool, private bot: TelegramBot) {
    this.gamePlayerRepository = new GamePlayerRepository(pool);
    this.gameRepository = new GameRepository(pool);
    this.jokeRepository = new JokeRepository(pool);
    this.adminGroupRepository = new AdminGroupRepository(pool);
    this.userRepository = new UserRepository(pool);
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
      } else if (data.startsWith('selectedGroupForStartGame_')) {
        await this.handleSelectedGroupStartGame(query);
      } else if (data.startsWith('selectedGroupForDeactiveGame_')) {
        await this.handleSelectedGroupDeactiveGame(query);
      } else if (data.startsWith('selectedGroupForShowUsers_')) {
        await this.handleSelectedGroupShowUsers(query);
      } else if (data.startsWith('selectedGroupForTagGamers_')) {
        await this.handleSelectedGroupTagGamers(query);
      } else if (data.startsWith('showPrivate_')) {
        await this.handleShowPrivate(query, user.id, user.username);
      } else if (data === 'showgames') {
        await this.handleShowGamesCallback(query, chatId);
      } else if (data === 'list') {
        await this.handleListCallback(query, chatId);
      } else if (data === 'register') {
        await this.handleRegisterCallback(query, chatId, user);
      } else if (data === 'agilliol') {
        await this.handleAgilliOlCallback(query, chatId);
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

    const label = await this.gamePlayerRepository.removeGamePlayerById(gameId, userId, chatId);

    if (label) {
      // Player was in the game and was removed - show joke
      const joke = await this.jokeRepository.getJoke(JokeType.LEFT_GAME);
      await this.bot.sendMessage(chatId, `@${username} удирает с игры на ${declineRussian(label, 'винительный')}. ${joke}`);
    } else {
      // Player wasn't in the game - just inform
      await this.bot.sendMessage(chatId, `@${username} минусует`);
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

    const label = await this.gamePlayerRepository.removeGamePlayerById(gameId, userId, chatId);

    if (label) {
      // Player was in the game and was removed - show joke
      const joke = await this.jokeRepository.getJoke(JokeType.LEFT_GAME);
      await this.bot.sendMessage(chatId, `@${username} удирает с игры на ${declineRussian(label, 'винительный')}. ${joke}`);
    } else {
      // Player wasn't in the game - just inform
      await this.bot.sendMessage(chatId, `@${username} минусует`);
    }
  }

  private async handleDeactivateGame(query: CallbackQuery, chatId: number): Promise<void> {
    const gameId = parseInt(query.data?.replace('deactivegame_', '') || '0');

    const label = await this.gameRepository.deactivateGame(gameId);

    if (label) {
      await this.bot.sendMessage(chatId, `Игра на ${declineRussian(label, 'винительный')} закрыта!`);
    }
  }

  // =========== ADMIN GROUP SELECTION CALLBACKS ===========

  private async handleSelectedGroupStartGame(query: CallbackQuery): Promise<void> {
    const data = query.data || '';
    const chatId = parseInt(data.replace('selectedGroupForStartGame_', ''));
    const adminChatId = query.message?.chat.id;

    if (!adminChatId) return;

    const isAdmin = await this.adminGroupRepository.isAdminOfGroup(adminChatId, chatId);

    if (!isAdmin) {
      await this.bot.sendMessage(adminChatId, 'Вы не администратор этой группы');
      return;
    }

    await this.bot.sendMessage(
      adminChatId,
      'Введите данные игры в формате:\n' +
        '/startgame дата/время начала/время конца/место/лимит\n\n' +
        'Пример: /startgame 15.03/18:30/20:30/Спортзал/10'
    );

    // Store selected chatId for next command
    const g = global as typeof globalThis & { selectedChatForStartGame?: Record<number, number> };
    g.selectedChatForStartGame = g.selectedChatForStartGame || {};
    g.selectedChatForStartGame[adminChatId] = chatId;
  }

  private async handleSelectedGroupDeactiveGame(query: CallbackQuery): Promise<void> {
    const data = query.data || '';
    const chatId = parseInt(data.replace('selectedGroupForDeactiveGame_', ''));
    const adminChatId = query.message?.chat.id;

    if (!adminChatId) return;

    const isAdmin = await this.adminGroupRepository.isAdminOfGroup(adminChatId, chatId);

    if (!isAdmin) {
      await this.bot.sendMessage(adminChatId, 'Вы не администратор этой группы');
      return;
    }

    // Show active games for this group
    const games = await this.gameRepository.getActiveGames(chatId);

    if (!games || games.length === 0) {
      await this.bot.sendMessage(adminChatId, 'Нет активных игр');
      return;
    }

    const gameButtons = games.map((game: Game) => [
      {
        text: `${game.label} (${game.game_date})`,
        callback_data: `deactivegame_${game.id}`
      }
    ]);

    await this.bot.sendMessage(adminChatId, 'Выберите игру для закрытия:', {
      reply_markup: {
        inline_keyboard: gameButtons
      }
    });
  }

  private async handleSelectedGroupShowUsers(query: CallbackQuery): Promise<void> {
    const data = query.data || '';
    const chatId = parseInt(data.replace('selectedGroupForShowUsers_', ''));
    const adminChatId = query.message?.chat.id;

    if (!adminChatId) return;

    const isAdmin = await this.adminGroupRepository.isAdminOfGroup(adminChatId, chatId);

    if (!isAdmin) {
      await this.bot.sendMessage(adminChatId, 'Вы не администратор этой группы');
      return;
    }

    // Get all users from this group
    const users = await this.userRepository.getUsersByChatId(chatId);

    if (!users || users.length === 0) {
      await this.bot.sendMessage(adminChatId, 'Нет зарегистрированных пользователей');
      return;
    }

    const usersList = users
      .map(
        (u: User, idx: number) =>
          `${idx + 1}. ${u.first_name} ${u.last_name || ''} ${u.fullname_az ? '(' + u.fullname_az + ')' : ''}`
      )
      .join('\n');

    await this.bot.sendMessage(adminChatId, `Пользователи группы:\n\n${usersList}`);
  }

  private async handleSelectedGroupTagGamers(query: CallbackQuery): Promise<void> {
    const data = query.data || '';
    const chatId = parseInt(data.replace('selectedGroupForTagGamers_', ''));
    const adminChatId = query.message?.chat.id;

    if (!adminChatId) return;

    const isAdmin = await this.adminGroupRepository.isAdminOfGroup(adminChatId, chatId);

    if (!isAdmin) {
      await this.bot.sendMessage(adminChatId, 'Вы не администратор этой группы');
      return;
    }

    // Get all users from this group
    const users = await this.userRepository.getUsersByChatId(chatId);

    if (!users || users.length === 0) {
      await this.bot.sendMessage(chatId, 'Нет зарегистрированных пользователей');
      return;
    }

    const mentions = users.map((u: User) => `@${u.username}`).filter(Boolean).join(' ');

    await this.bot.sendMessage(chatId, `Эй, игроки! ${mentions}`);
  }

  // =========== PRIVATE MESSAGE ===========

  private async handleShowPrivate(query: CallbackQuery, userId: number, username?: string): Promise<void> {
    if (!username) {
      await this.bot.answerCallbackQuery(query.id, { text: 'У вас нет username' });
      return;
    }

    const data = query.data || '';
    const targetUsername = data.replace('showPrivate_', '');

    if (targetUsername !== username) {
      await this.bot.answerCallbackQuery(query.id, { text: 'Это сообщение не для вас!' });
      return;
    }

    const g = global as typeof globalThis & { privateMessages?: Record<string, string> };
    const message = g.privateMessages?.[username];

    if (!message) {
      await this.bot.answerCallbackQuery(query.id, { text: 'Сообщение не найдено' });
      return;
    }

    await this.bot.sendMessage(userId, `Личное сообщение:\n\n${message}`);
    await this.bot.answerCallbackQuery(query.id, { text: 'Сообщение отправлено в личку!' });

    // Clean up message
    if (g.privateMessages) {
      delete g.privateMessages[username];
    }
  }

  // =========== MENU CALLBACKS ===========

  private async handleShowGamesCallback(query: CallbackQuery, chatId: number): Promise<void> {
    await this.bot.answerCallbackQuery(query.id);
    
    const games = await this.gameRepository.getGames(chatId);

    if (!games || games.length === 0) {
      await this.bot.sendMessage(chatId, 'На данный момент нет активных игр');
      return;
    }

    for (const game of games) {
      const players = await this.gamePlayerRepository.getGamePlayers(game.id);
      const confirmedCount = players.filter(p => p.confirmed_attendance).length;
      const unconfirmedCount = players.filter(p => !p.confirmed_attendance).length;

      const keyboard = {
        inline_keyboard: [
          [
            { text: `✅ Иду (${confirmedCount})`, callback_data: `appointment_${game.id}` },
            { text: `❓ Не точно (${unconfirmedCount})`, callback_data: `notconfirmed_${game.id}` },
            { text: '❌ Не иду', callback_data: `decline_${game.id}` }
          ]
        ]
      };

      await this.bot.sendMessage(
        chatId,
        `🏐 ${game.label}\n📅 ${game.game_date}\n⏰ ${game.game_starts} - ${game.game_ends}\n📍 ${game.place}\n👥 Лимит: ${game.users_limit}`,
        { reply_markup: keyboard }
      );
    }
  }

  private async handleListCallback(query: CallbackQuery, chatId: number): Promise<void> {
    await this.bot.answerCallbackQuery(query.id);

    const games = await this.gameRepository.getGames(chatId);

    if (!games || games.length === 0) {
      await this.bot.sendMessage(chatId, 'На данный момент нет активных игр');
      return;
    }

    for (const game of games) {
      const players = await this.gamePlayerRepository.getGamePlayers(game.id);

      if (players.length === 0) {
        await this.bot.sendMessage(chatId, `${game.label}: Нет участников`);
        continue;
      }

      const confirmed = players.filter(p => p.confirmed_attendance);
      const unconfirmed = players.filter(p => !p.confirmed_attendance);

      let message = `📋 ${game.label}\n\n`;

      if (confirmed.length > 0) {
        message += '✅ Идут:\n';
        confirmed.forEach((p, idx) => {
          message += `${idx + 1}. ${p.first_name} ${p.last_name || ''}\n`;
        });
      }

      if (unconfirmed.length > 0) {
        message += '\n❓ Не точно:\n';
        unconfirmed.forEach((p, idx) => {
          message += `${idx + 1}. ${p.first_name} ${p.last_name || ''}\n`;
        });
      }

      await this.bot.sendMessage(chatId, message);
    }
  }

  private async handleRegisterCallback(query: CallbackQuery, chatId: number, user: TelegramBot.User): Promise<void> {
    await this.bot.answerCallbackQuery(query.id);

    try {
      const checkUser = await this.userRepository.getUserByUsername(user.username || '');
      
      if (checkUser) {
        await this.bot.sendMessage(chatId, 'İstifadəçi artıq qrupda var / Пользователь уже существует в группе');
        return;
      }

      const result = await this.userRepository.addUser({
        user_id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        chat_id: chatId,
      });

      await this.bot.sendMessage(chatId, result);
    } catch (error) {
      console.error('REGISTER CALLBACK ERROR:', error);
      await this.bot.sendMessage(chatId, 'Произошла ошибка при регистрации');
    }
  }

  private async handleAgilliOlCallback(query: CallbackQuery, chatId: number): Promise<void> {
    await this.bot.answerCallbackQuery(query.id);

    try {
      const users = await this.userRepository.getUsers(chatId);

      if (!users || users.length === 0) {
        await this.bot.sendMessage(chatId, 'Нет зарегистрированных пользователей');
        return;
      }

      const randomUser = users[Math.floor(Math.random() * users.length)];
      const joke = await this.jokeRepository.getRandomJoke(JokeType.AGILLIOL);

      await this.bot.sendMessage(
        chatId,
        `${randomUser.first_name} ${randomUser.last_name || ''}, ${joke?.joke || 'Ağıllı ol!'}`
      );
    } catch (error) {
      console.error('AGILLIOL CALLBACK ERROR:', error);
      await this.bot.sendMessage(chatId, 'Произошла ошибка');
    }
  }
}
