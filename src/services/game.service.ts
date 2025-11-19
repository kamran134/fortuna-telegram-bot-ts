/**
 * Game service - business logic for game operations
 */

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
import { logger } from '../utils/logger';
import { BotMessenger } from './bot-messenger.service';

export class GameService {
  constructor(
    private gameRepository: GameRepository,
    private gamePlayerRepository: GamePlayerRepository,
    private userRepository: UserRepository,
    private jokeRepository: JokeRepository,
    private botMessenger: BotMessenger
  ) {}

  /**
   * Create a new game
   */
  async createGame(chatId: number, gameData: CreateGameDto, messageThreadId?: number): Promise<void> {
    try {
      const users = await this.userRepository.getUsers(chatId);

      if (!users || users.length === 0) {
        await this.botMessenger.sendMessage(
          chatId, 
          'Кажется у нас нет зарегистрированных игроков для игры :(',
          {},
          messageThreadId
        );
        return;
      }

      const gameId = await this.gameRepository.addGame(chatId, gameData);

      if (!gameId) {
        await this.botMessenger.sendMessage(
          chatId,
          'Что-то пошло не так и игра не создалась',
          {},
          messageThreadId
        );
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

      await this.botMessenger.sendMessageWithKeyboard(
        chatId,
        gameMessage,
        keyboard,
        { parse_mode: 'HTML' },
        messageThreadId
      );

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

          await this.botMessenger.sendMessageWithKeyboard(
            user.user_id,
            `📢 ${gameDayAz.charAt(0).toUpperCase() + gameDayAz.slice(1)} oyun elan edildi!\n` +
              `📢 Объявлена игра на ${gameDayRu}!\n` +
              `🗓 Tarix / Дата: ${gameData.date}\n` +
              `⏳ Vaxt / Время: ${gameData.start} — ${gameData.end}.\n` +
              `📍 Məkan / Место: ${gameData.location}`,
            privateKeyboard,
            { parse_mode: 'HTML' }
          );
        } catch (error) {
          // User might have blocked the bot
          logger.error(`Failed to send message to user ${user.user_id}:`, error);
        }
      }
    } catch (error) {
      logger.error('GAME SERVICE - CREATE GAME ERROR', error);
      await this.botMessenger.sendMessage(chatId, Messages.ERROR_OCCURRED, {}, messageThreadId);
    }
  }

  /**
   * Show all active games
   */
  async showGames(chatId: number, messageThreadId?: number): Promise<void> {
    try {
      const games = await this.gameRepository.getGames(chatId);

      if (!games || games.length === 0) {
        await this.botMessenger.sendMessage(chatId, Messages.NO_GAMES, {}, messageThreadId);
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

      await this.botMessenger.sendMessageWithKeyboard(
        chatId,
        gamesString,
        { inline_keyboard: gameButtons },
        {},
        messageThreadId
      );
    } catch (error) {
      logger.error('GAME SERVICE - SHOW GAMES ERROR:', error);
      await this.botMessenger.sendMessage(chatId, Messages.ERROR_OCCURRED, {}, messageThreadId);
    }
  }

  /**
   * Show game players
   */
  async showGamePlayers(chatId: number, messageThreadId?: number): Promise<void> {
    try {
      const gamePlayers = await this.gamePlayerRepository.getGamePlayers(chatId);

      if (!gamePlayers || gamePlayers.length === 0) {
        await this.botMessenger.sendMessage(chatId, Messages.NO_PLAYERS, {}, messageThreadId);
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

      await this.botMessenger.sendMessage(
        chatId,
        messages.join('\n\n🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸\n\n'),
        {},
        messageThreadId
      );
    } catch (error) {
      logger.error('GAME SERVICE - SHOW GAME PLAYERS ERROR:', error);
      await this.botMessenger.sendMessage(chatId, Messages.ERROR_OCCURRED, {}, messageThreadId);
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
      logger.error('GAME SERVICE - TAG PLAYERS ERROR:', error);
      return Messages.ERROR_OCCURRED;
    }
  }

  /**
   * Deactivate games
   */
  async deactivateGames(chatId: number, isAdmin: boolean, messageThreadId?: number): Promise<void> {
    if (!isAdmin) {
      try {
        const joke = await this.jokeRepository.getJoke(JokeType.DEACTIVE_GAME);
        await this.botMessenger.sendHTMLMessage(
          chatId,
          `Только одмэн может закрыть игру. ${joke}`,
          messageThreadId
        );
      } catch {
        await this.botMessenger.sendMessage(
          chatId,
          'Только одмэн может закрыть игру.',
          {},
          messageThreadId
        );
      }
      return;
    }

    try {
      const games = await this.gameRepository.getGames(chatId);

      if (!games || games.length === 0) {
        await this.botMessenger.sendMessage(
          chatId,
          'Ты не можешь деактивировать игру, если активных игр нет',
          {},
          messageThreadId
        );
        return;
      }

      const gamesString = games
        .map((game, index) => `Игра №${index + 1}\n    Дата: ${moment(game.game_date).format('DD.MM.YYYY')} (${game.label})\n`)
        .join('\n----------------------------------\n');

      const gameButtons = games.map((game) => [
        { text: `Закрыть игру на ${declineRussian(game.label, 'винительный')}`, callback_data: `deactivegame_${game.id}` },
      ]);

      await this.botMessenger.sendMessageWithKeyboard(
        chatId,
        gamesString,
        { inline_keyboard: gameButtons },
        {},
        messageThreadId
      );
    } catch (error) {
      logger.error('GAME SERVICE - DEACTIVATE GAMES ERROR:', error);
      await this.botMessenger.sendMessage(chatId, Messages.ERROR_OCCURRED, {}, messageThreadId);
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
  async showGamesTimes(chatId: number, messageThreadId?: number): Promise<void> {
    try {
      const gamesTimes = await this.gameRepository.getGamesTimes(chatId);

      if (!gamesTimes || gamesTimes.length === 0) {
        await this.botMessenger.sendMessage(chatId, 'Нет активных игр', {}, messageThreadId);
        return;
      }

      const timesString = gamesTimes
        .map(game => `${game.label}: ${moment(game.game_starts, 'HH:mm:ss').format('HH:mm')}`)
        .join(', ');

      await this.botMessenger.sendMessage(
        chatId,
        `Мэээх. Сколько можно спрашивать? 😒\n${timesString}`,
        {},
        messageThreadId
      );
    } catch (error) {
      logger.error('SHOW GAMES TIMES ERROR:', error);
      throw error;
    }
  }

  /**
   * Tag undecided players
   */
  async tagUndecidedPlayers(chatId: number, messageThreadId?: number): Promise<void> {
    try {
      const players = await this.gamePlayerRepository.getUndecidedPlayers(chatId);

      if (!players || players.length === 0) {
        await this.botMessenger.sendMessage(chatId, 'Нет неопределившихся игроков', {}, messageThreadId);
        return;
      }

      const uniquePlayers = Array.from(
        new Map(players.map(p => [p.user_id, p])).values()
      );

      const taggedPlayers = tagUsersByCommas(uniquePlayers);
      const message = `${taggedPlayers}, ну шо, товарищи? Пришло время определиться! Играть будем или нет?`;

      await this.botMessenger.sendHTMLMessage(chatId, message, messageThreadId);
    } catch (error) {
      logger.error('TAG UNDECIDED PLAYERS ERROR:', error);
      throw error;
    }
  }

  /**
   * Change game limit
   */
  async changeGameLimit(chatId: number, label: string, newLimit: number): Promise<void> {
    try {
      const updatedLabel = await this.gameRepository.changeGameLimit({ chatId, label, limit: newLimit });

      if (updatedLabel) {
        const declinedLabel = declineRussian(updatedLabel, 'винительный');
        await this.botMessenger.sendMessage(
          chatId,
          `Изменено количество игроков на игру в ${declinedLabel}!`
        );
      } else {
        await this.botMessenger.sendMessage(chatId, 'Кажется, такой игры больше нет');
      }
    } catch (error) {
      logger.error('CHANGE GAME LIMIT ERROR:', error);
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
    confirmedAttendance: boolean
  ): Promise<void> {
    try {
      const names = fullname.split(' ');
      const firstName = names[0];
      const lastName = names.slice(1).join(' ') || '';

      // Add guest user (uses MAX(id) + 1 for user_id to avoid conflicts)
      const guestId = await this.userRepository.addGuest(chatId, firstName, lastName);

      if (!guestId) {
        await this.botMessenger.sendMessage(chatId, 'Не удалось добавить гостя');
        return;
      }

      // Add guest to game
      await this.gamePlayerRepository.addGamePlayerByLabel(chatId, gameLabel, guestId, confirmedAttendance);

      const declinedLabel = declineRussian(gameLabel, 'винительный');
      const certainty = confirmedAttendance ? '' : ' Но это не точно :(';
      await this.botMessenger.sendMessage(
        chatId,
        `Вы записали ${firstName} ${lastName} на ${declinedLabel}!${certainty}`
      );
    } catch (error) {
      logger.error('ADD GUEST ERROR:', error);
      if (error instanceof Error && error.message === 'Game not found') {
        await this.botMessenger.sendMessage(chatId, 'Игра не найдена');
      } else {
        await this.botMessenger.sendMessage(chatId, 'Не удалось добавить гостя в игру');
      }
    }
  }

  /**
   * Show undecided players for a game with confirmation buttons
   */
  async showUndecidedPlayersForConfirmation(
    chatId: number,
    gameLabel: string,
    messageThreadId?: number
  ): Promise<void> {
    try {
      const undecidedPlayers = await this.gamePlayerRepository.getUndecidedPlayersByGameLabel(chatId, gameLabel);

      if (!undecidedPlayers || undecidedPlayers.length === 0) {
        await this.botMessenger.sendMessage(
          chatId,
          `На игру в ${declineRussian(gameLabel, 'винительный')} нет неопределившихся игроков`,
          {},
          messageThreadId
        );
        return;
      }

      const buttons = undecidedPlayers.map((player, index) => {
        const name = `${player.first_name} ${player.last_name || ''}`.trim();
        const guestLabel = player.is_guest ? ' (гость)' : '';
        // Callback format: confirmplayer_gameId_userDbId
        return [{
          text: `✅ ${index + 1}. ${name}${guestLabel}`,
          callback_data: `confirmplayer_${player.game_id}_${player.user_db_id || 0}`
        }];
      });

      const message = 
        `Неопределившиеся игроки на ${declineRussian(gameLabel, 'винительный')}:\n\n` +
        undecidedPlayers.map((p, i) => {
          const name = `${p.first_name} ${p.last_name || ''}`.trim();
          const guestLabel = p.is_guest ? ' (гость)' : '';
          return `${i + 1}. ${name}${guestLabel}`;
        }).join('\n') +
        '\n\nНажмите на кнопку, чтобы подтвердить игрока:';

      await this.botMessenger.sendMessageWithKeyboard(
        chatId,
        message,
        { inline_keyboard: buttons },
        {},
        messageThreadId
      );
    } catch (error) {
      logger.error('SHOW UNDECIDED PLAYERS FOR CONFIRMATION ERROR:', error);
      await this.botMessenger.sendMessage(
        chatId,
        Messages.ERROR_OCCURRED,
        {},
        messageThreadId
      );
    }
  }

  /**
   * Confirm player attendance
   */
  async confirmPlayer(gameId: number, userDbId: number): Promise<string> {
    try {
      const confirmed = await this.gamePlayerRepository.confirmPlayerAttendance(gameId, userDbId);

      if (confirmed) {
        return '✅ Игрок подтверждён!';
      } else {
        return '❌ Игрок не найден или уже подтверждён';
      }
    } catch (error) {
      logger.error('CONFIRM PLAYER ERROR:', error);
      return Messages.ERROR_OCCURRED;
    }
  }
}
