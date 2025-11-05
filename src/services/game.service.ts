/**
 * Game service - business logic for game operations
 */

import TelegramBot from 'node-telegram-bot-api';
import moment from 'moment';
import { GameRepository } from '../database/repositories/game.repository';
import { GamePlayerRepository } from '../database/repositories/gamePlayer.repository';
import { UserRepository } from '../database/repositories/user.repository';
import { JokeRepository } from '../database/repositories/joke.repository';
import { CreateGameDto, GamePlayerDetails } from '../types/game.types';
import { JokeType } from '../types/admin.types';
import { declineRussian, declineAzerbaijaniFull } from '../utils/declension';
import { tagUsersByCommas } from '../utils/formatter';
import { Messages } from '../constants/messages';

export class GameService {
  constructor(
    private gameRepository: GameRepository,
    private gamePlayerRepository: GamePlayerRepository,
    private userRepository: UserRepository,
    private jokeRepository: JokeRepository
  ) {}

  /**
   * Create a new game
   */
  async createGame(chatId: number, gameData: CreateGameDto, bot: TelegramBot): Promise<void> {
    try {
      const users = await this.userRepository.getUsers(chatId);

      if (!users || users.length === 0) {
        await bot.sendMessage(chatId, 'Кажется у нас нет зарегистрированных игроков для игры :(');
        return;
      }

      const gameId = await this.gameRepository.addGame(chatId, gameData);

      if (!gameId) {
        await bot.sendMessage(chatId, 'Что-то пошло не так и игра не создалась');
        return;
      }

      const gameDayAz = declineAzerbaijaniFull(gameData.label, 'дательный');
      const gameDayRu = declineRussian(gameData.label, 'винительный');
      const taggedUsers = tagUsersByCommas(users);

      const gameMessage =
        `📢 ${gameDayAz.charAt(0).toUpperCase() + gameDayAz.slice(1)} oyun elan edildi!\n` +
        `📢 Объявлена игра на ${gameDayRu}!\n` +
        `🗓 Tarix / Дата: ${gameData.date}\n` +
        `⏳ Vaxt / Время: ${gameData.start} — ${gameData.end}.\n` +
        `📍 Məkan / Место: ${gameData.location}\n\n${taggedUsers}`;

      const keyboard = {
        inline_keyboard: [
          [{ text: 'Oyuna yazılmaq / Записаться на игру', callback_data: `appointment_${gameId}` }],
          [{ text: 'Dəqiq deyil / Не точно', callback_data: `notconfirmed_${gameId}` }],
          [{ text: 'İmtina etmək / Отказаться от игры', callback_data: `decline_${gameId}` }],
        ],
      };

      await bot.sendMessage(chatId, gameMessage, {
        parse_mode: 'HTML',
        reply_markup: keyboard,
      });

      // Send private messages to all users
      for (const user of users) {
        try {
          const privateKeyboard = {
            inline_keyboard: [
              [{ text: 'Oyuna yazılmaq / Записаться', callback_data: `privateAppointment_${chatId}_${gameId}` }],
              [{ text: 'Dəqiq deyil / Не точно', callback_data: `privateNotconfirmed_${chatId}_${gameId}` }],
              [{ text: 'İmtina etmək / Отказаться', callback_data: `privateDecline_${chatId}_${gameId}` }],
            ],
          };

          await bot.sendMessage(
            user.user_id,
            `📢 ${gameDayAz.charAt(0).toUpperCase() + gameDayAz.slice(1)} oyun elan edildi!\n` +
              `📢 Объявлена игра на ${gameDayRu}!\n` +
              `🗓 Tarix / Дата: ${gameData.date}\n` +
              `⏳ Vaxt / Время: ${gameData.start} — ${gameData.end}.\n` +
              `📍 Məkan / Место: ${gameData.location}`,
            { parse_mode: 'HTML', reply_markup: privateKeyboard }
          );
        } catch (error) {
          // User might have blocked the bot
          console.error(`Failed to send message to user ${user.user_id}:`, error);
        }
      }
    } catch (error) {
      console.error('GAME SERVICE - CREATE GAME ERROR:', error);
      await bot.sendMessage(chatId, Messages.ERROR_OCCURRED);
    }
  }

  /**
   * Show all active games
   */
  async showGames(chatId: number, bot: TelegramBot): Promise<void> {
    try {
      const games = await this.gameRepository.getGames(chatId);

      if (!games || games.length === 0) {
        await bot.sendMessage(chatId, Messages.NO_GAMES);
        return;
      }

      const gameButtons = games.map((game) => [
        { text: `+ на ${declineRussian(game.label, 'винительный')}`, callback_data: `appointment_${game.id}` },
        { text: `+/- на ${declineRussian(game.label, 'винительный')}`, callback_data: `notconfirmed_${game.id}` },
        { text: `- на ${declineRussian(game.label, 'винительный')}`, callback_data: `decline_${game.id}` },
      ]);

      const gamesString = games
        .map(
          (game, index) =>
            `🏐 Oyun № ${index + 1} / Игра №${index + 1}\n` +
            `🗓 Tarix / Дата: ${moment(game.game_date).format('DD.MM.YYYY')} (${declineAzerbaijaniFull(game.label, 'именительный')} / ${game.label})\n` +
            `⏳ Vaxt / Время: ${moment(game.game_starts, 'HH:mm:ss').format('HH:mm')} — ${moment(game.game_ends, 'HH:mm:ss').format('HH:mm')}\n` +
            `📍 Məkan / Место: ${game.place}`
        )
        .join('\n----------------------------------\n');

      await bot.sendMessage(chatId, gamesString, {
        reply_markup: { inline_keyboard: gameButtons },
      });
    } catch (error) {
      console.error('GAME SERVICE - SHOW GAMES ERROR:', error);
      await bot.sendMessage(chatId, Messages.ERROR_OCCURRED);
    }
  }

  /**
   * Show game players
   */
  async showGamePlayers(chatId: number, bot: TelegramBot): Promise<void> {
    try {
      const gamePlayers = await this.gamePlayerRepository.getGamePlayers(chatId);

      if (!gamePlayers || gamePlayers.length === 0) {
        await bot.sendMessage(chatId, Messages.NO_PLAYERS);
        return;
      }

      // Group players by game
      const gameGroups = this.groupPlayersByGame(gamePlayers);
      const messages: string[] = [];

      for (const [gameId, data] of Object.entries(gameGroups)) {
        const placeLeft = data.users_limit - data.players.length;
        interface PlayerDisplayData {
            first_name: string;
            last_name?: string;
            confirmed_attendance: boolean;
            is_guest: boolean;
        }

                        const playersString: string = data.players
                            .map((p: PlayerDisplayData, i: number): string => {
                                const waitList: string = i === data.users_limit ? '\n--------------Wait list--------------\n' : '';
                                const icon: string = p.confirmed_attendance ? '✅' : '❓';
                                const guest: string = p.is_guest ? '(гость)' : '';
                                return `${waitList}\t${icon} ${p.first_name} ${p.last_name || ''} ${guest}`;
                            })
                            .join('\n');

        const gameDayAz = declineAzerbaijaniFull(data.label, 'именительный');

        const message =
          `${gameDayAz.charAt(0).toUpperCase() + gameDayAz.slice(1)} oyunu\n` +
          `Игра на ${declineRussian(data.label, 'винительный')}\n` +
          `🗓 Tarix / Дата: ${moment(data.game_date).format('DD.MM.YYYY')}\n` +
          `⏳ Vaxt / Время: ${moment(data.game_starts, 'HH:mm:ss').format('HH:mm')} - ${moment(data.game_ends, 'HH:mm:ss').format('HH:mm')}\n` +
          `📍 Məkan / Место: ${data.place}\n\n` +
          `👤 İştirakçılar / Участники:\n${playersString}\n\n` +
          `⚠️ Qalan yer sayı / Осталось мест: ${placeLeft >= 0 ? placeLeft : 0}`;

        messages.push(message);
      }

      await bot.sendMessage(chatId, messages.join('\n\n🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸\n\n'));
    } catch (error) {
      console.error('GAME SERVICE - SHOW PLAYERS ERROR:', error);
      await bot.sendMessage(chatId, Messages.ERROR_OCCURRED);
    }
  }

  /**
   * Tag game players
   */
  async tagGamePlayers(chatId: number, isAdmin: boolean): Promise<string> {
    if (!isAdmin) {
      try {
        const joke = await this.jokeRepository.getJoke(JokeType.TAG_REGISTERED);
        return 'Только одмэн может тегать игроков! ' + joke;
      } catch (error) {
        return 'Только одмэн может тегать игроков!';
      }
    }

    try {
      const gamePlayers = await this.gamePlayerRepository.getGamePlayers(chatId);

      if (!gamePlayers || gamePlayers.length === 0) {
        return 'Нет записавшихся на игру. Тревожить некого.';
      }

      const tagged = tagUsersByCommas(gamePlayers as any);
      return `${tagged}, у одмэна к вам дело, ща напишет. Не перебивайте!`;
    } catch (error) {
      console.error('GAME SERVICE - TAG PLAYERS ERROR:', error);
      return Messages.ERROR_OCCURRED;
    }
  }

  /**
   * Deactivate games
   */
  async deactivateGames(chatId: number, isAdmin: boolean, bot: TelegramBot): Promise<void> {
    if (!isAdmin) {
      try {
        const joke = await this.jokeRepository.getJoke(JokeType.DEACTIVE_GAME);
        await bot.sendMessage(chatId, `Только одмэн может закрыть игру. ${joke}`, { parse_mode: 'HTML' });
      } catch (error) {
        await bot.sendMessage(chatId, 'Только одмэн может закрыть игру.');
      }
      return;
    }

    try {
      const games = await this.gameRepository.getGames(chatId);

      if (!games || games.length === 0) {
        await bot.sendMessage(chatId, 'Ты не можешь деактивировать игру, если активных игр нет');
        return;
      }

      const gamesString = games
        .map((game, index) => `Игра №${index + 1}\n    Дата: ${moment(game.game_date).format('DD.MM.YYYY')} (${game.label})\n`)
        .join('\n----------------------------------\n');

      const gameButtons = games.map((game) => [
        { text: `Закрыть игру на ${declineRussian(game.label, 'винительный')}`, callback_data: `deactivegame_${game.id}` },
      ]);

      await bot.sendMessage(chatId, gamesString, {
        reply_markup: { inline_keyboard: gameButtons },
      });
    } catch (error) {
      console.error('GAME SERVICE - DEACTIVATE GAMES ERROR:', error);
      await bot.sendMessage(chatId, Messages.ERROR_OCCURRED);
    }
  }

  /**
   * Group players by game ID
   */
  private groupPlayersByGame(players: GamePlayerDetails[]): Record<string, any> {
    const groups: Record<string, any> = {};

    for (const player of players) {
      if (!groups[player.game_id]) {
        groups[player.game_id] = {
          players: [],
          game_date: player.game_date,
          game_starts: player.game_starts,
          game_ends: player.game_ends,
          place: player.place,
          label: player.label,
          users_limit: player.users_limit,
        };
      }
      groups[player.game_id].players.push(player);
    }

    return groups;
  }
}
