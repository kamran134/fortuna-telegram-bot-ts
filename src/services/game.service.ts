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

      for (const data of Object.values(gameGroups)) {
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
      } catch {
        return 'Только одмэн может тегать игроков!';
      }
    }

    try {
      const gamePlayers = await this.gamePlayerRepository.getGamePlayers(chatId);

      if (!gamePlayers || gamePlayers.length === 0) {
        return 'Нет записавшихся на игру. Тревожить некого.';
      }

      const tagged = tagUsersByCommas(gamePlayers);
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
      } catch {
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
  private groupPlayersByGame(players: GamePlayerDetails[]) {
    interface GameGroupData {
      players: GamePlayerDetails[];
      game_date: Date;
      game_starts: string;
      game_ends: string;
      place: string;
      label: string;
      users_limit: number;
    }

    const groups: Record<string, GameGroupData> = {};

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

    // Sort players in each game: confirmed first, then unconfirmed
    for (const gameData of Object.values(groups)) {
      gameData.players.sort((a, b) => {
        // Confirmed first
        if (a.confirmed_attendance && !b.confirmed_attendance) return -1;
        if (!a.confirmed_attendance && b.confirmed_attendance) return 1;
        return 0;
      });
    }

    return groups;
  }

  /**
   * Show games start times
   */
  async showGamesTimes(chatId: number, bot: TelegramBot): Promise<void> {
    try {
      const gamesTimes = await this.gameRepository.getGamesTimes(chatId);

      if (!gamesTimes || gamesTimes.length === 0) {
        await bot.sendMessage(chatId, 'Нет активных игр');
        return;
      }

      const timesString = gamesTimes
        .map(game => `${game.label}: ${moment(game.game_starts, 'HH:mm:ss').format('HH:mm')}`)
        .join(', ');

      await bot.sendMessage(chatId, `Мэээх. Сколько можно спрашивать? 😒\n${timesString}`);
    } catch (error) {
      console.error('SHOW GAMES TIMES ERROR:', error);
      throw error;
    }
  }

  /**
   * Tag undecided players
   */
  async tagUndecidedPlayers(chatId: number, bot: TelegramBot): Promise<void> {
    try {
      const players = await this.gamePlayerRepository.getUndecidedPlayers(chatId);

      if (!players || players.length === 0) {
        await bot.sendMessage(chatId, 'Нет неопределившихся игроков');
        return;
      }

      const uniquePlayers = Array.from(
        new Map(players.map(p => [p.user_id, p])).values()
      );

      const taggedPlayers = tagUsersByCommas(uniquePlayers);
      const message = `${taggedPlayers}, ну шо, товарищи? Пришло время определиться! Играть будем или нет?`;

      await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
    } catch (error) {
      console.error('TAG UNDECIDED PLAYERS ERROR:', error);
      throw error;
    }
  }

  /**
   * Change game limit
   */
  async changeGameLimit(chatId: number, label: string, newLimit: number, bot: TelegramBot): Promise<void> {
    try {
      const updatedLabel = await this.gameRepository.changeGameLimit({ chatId, label, limit: newLimit });

      if (updatedLabel) {
        const declinedLabel = declineRussian(updatedLabel, 'винительный');
        await bot.sendMessage(chatId, `Изменено количество игроков на игру в ${declinedLabel}!`);
      } else {
        await bot.sendMessage(chatId, 'Кажется, такой игры больше нет');
      }
    } catch (error) {
      console.error('CHANGE GAME LIMIT ERROR:', error);
      throw error;
    }
  }

  /**
   * Add guest to game
   */
  async addGuestToGame(
    chatId: number,
    gameLabel: string,
    fullname: string,
    confirmedAttendance: boolean,
    bot: TelegramBot
  ): Promise<void> {
    try {
      const names = fullname.split(' ');
      const firstName = names[0];
      const lastName = names.slice(1).join(' ') || '';

      // Add guest user
      const result = await this.userRepository.addUser({
        user_id: Math.random(), // Guest doesn't have telegram ID
        first_name: firstName,
        last_name: lastName,
        chat_id: chatId,
        is_guest: true,
      });

      if (result === Messages.USER_ALREADY_IN_GROUP) {
        await bot.sendMessage(chatId, 'Гость с таким именем уже существует');
        return;
      }

      // Get the guest user
      const guest = await this.userRepository.getUserByName(chatId, firstName, lastName);
      if (!guest) {
        await bot.sendMessage(chatId, 'Не удалось добавить гостя');
        return;
      }

      // Add guest to game
      await this.gamePlayerRepository.addGamePlayerByLabel(chatId, gameLabel, guest.id, confirmedAttendance);

      const declinedLabel = declineRussian(gameLabel, 'винительный');
      const certainty = confirmedAttendance ? '' : ' Но это не точно :(';
      await bot.sendMessage(
        chatId,
        `Вы записали ${firstName} ${lastName} на ${declinedLabel}!${certainty}`
      );
    } catch (error) {
      console.error('ADD GUEST ERROR:', error);
      if (error instanceof Error && error.message === 'Game not found') {
        await bot.sendMessage(chatId, 'Игра не найдена');
      } else {
        await bot.sendMessage(chatId, 'Не удалось добавить гостя в игру');
      }
    }
  }
}
