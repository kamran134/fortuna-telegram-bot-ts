/**
 * Command handler - processes bot commands and messages
 */

import TelegramBot, { Message } from 'node-telegram-bot-api';
import { Pool } from 'pg';
import { UserRepository } from '../../database/repositories/user.repository';
import { GameRepository } from '../../database/repositories/game.repository';
import { GamePlayerRepository } from '../../database/repositories/gamePlayer.repository';
import { JokeRepository } from '../../database/repositories/joke.repository';
import { AdminGroupRepository } from '../../database/repositories/adminGroup.repository';
import { UserService } from '../../services/user.service';
import { GameService } from '../../services/game.service';
import { validateGameFormat, parseGameCommand } from '../../utils/validator';
import { Messages } from '../../constants/messages';

export class CommandHandler {
  private userService: UserService;
  private gameService: GameService;

  constructor(pool: Pool, private bot: TelegramBot) {
    const userRepo = new UserRepository(pool);
    const gameRepo = new GameRepository(pool);
    const gamePlayerRepo = new GamePlayerRepository(pool);
    const jokeRepo = new JokeRepository(pool);
    // Admin group repo will be used in future features
    new AdminGroupRepository(pool);

    this.userService = new UserService(userRepo, jokeRepo);
    this.gameService = new GameService(gameRepo, gamePlayerRepo, userRepo, jokeRepo);
  }

  /**
   * Handle incoming messages
   */
  async handleMessage(msg: Message): Promise<void> {
    const chatId = msg.chat.id;
    const userId = msg.from?.id;
    const user = msg.from;
    
    if (!userId || !user) return;

    const messageText = msg.text?.startsWith('/')
      ? msg.text.toLowerCase().replace('@fortunavolleybalbot', '')
      : msg.text?.toLowerCase() || '';

    // Check if user is admin
    const chatMember = await this.bot.getChatMember(chatId, userId);
    const isAdmin = chatMember.status === 'administrator' || chatMember.status === 'creator';

    // Handle commands
    try {
      if (messageText === '/register') {
        await this.handleRegister(chatId, user);
      } else if (messageText === '/menu') {
        await this.handleMenu(chatId);
      } else if (messageText === '/tagregistered') {
        await this.handleTagRegistered(chatId, isAdmin);
      } else if (messageText === '/showregistered') {
        await this.handleShowRegistered(chatId, isAdmin);
      } else if (messageText.startsWith('/startgame')) {
        await this.handleStartGame(msg, isAdmin);
      } else if (messageText === '/showgames') {
        await this.handleShowGames(chatId);
      } else if (messageText === '/deactivegame') {
        await this.handleDeactiveGames(chatId, isAdmin);
      } else if (messageText === '/list') {
        await this.handleList(chatId);
      } else if (messageText.startsWith('/addguest') && isAdmin) {
        await this.handleAddGuest(msg);
      } else if (messageText === '/agilliol' || messageText === '/ağıllı ol') {
        await this.handleAgilliOl(chatId);
      } else if (messageText === '/taggamers') {
        await this.handleTagGamers(chatId, isAdmin);
      } else if (messageText === '/getgroupid' && isAdmin) {
        await this.bot.sendMessage(userId, `ID вашей группы ${chatId}`);
      }
      // Add more command handlers as needed
    } catch (error) {
      console.error('Command handling error:', error);
      await this.bot.sendMessage(chatId, Messages.ERROR_OCCURRED);
    }
  }

  private async handleRegister(chatId: number, user: TelegramBot.User): Promise<void> {
    const result = await this.userService.registerUser({
      user_id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      username: user.username,
      chat_id: chatId,
    });
    await this.bot.sendMessage(chatId, result);
  }

  private async handleMenu(chatId: number): Promise<void> {
    const keyboard = {
      inline_keyboard: [
        [{ text: '📋 Показать игры', callback_data: 'showgames' }],
        [{ text: '👥 Список игроков', callback_data: 'list' }],
        [{ text: '✅ Регистрация', callback_data: 'register' }],
        [{ text: '🧠 Ağıllı ol', callback_data: 'agilliol' }],
      ],
    };
    await this.bot.sendMessage(chatId, '📱 Главное меню:', { reply_markup: keyboard });
  }

  private async handleTagRegistered(chatId: number, isAdmin: boolean): Promise<void> {
    const result = await this.userService.getRegisteredUsers(chatId, 'tag', isAdmin);
    await this.bot.sendMessage(chatId, result, { parse_mode: 'HTML' });
  }

  private async handleShowRegistered(chatId: number, isAdmin: boolean): Promise<void> {
    const result = await this.userService.getRegisteredUsers(chatId, 'show', isAdmin);
    await this.bot.sendMessage(chatId, result, { parse_mode: 'HTML' });
  }

  private async handleStartGame(msg: Message, isAdmin: boolean): Promise<void> {
    const chatId = msg.chat.id;
    
    if (!isAdmin) {
      await this.bot.sendMessage(chatId, Messages.ADMIN_ONLY);
      return;
    }

    const commandText = msg.text?.replace('/startgame ', '') || '';
    
    if (!validateGameFormat(commandText)) {
      await this.bot.sendMessage(
        chatId,
        'Введённый формат неверный. Введите в формате `/startgame ДД.ММ.ГГГГ/ЧЧ:ММ/ЧЧ:ММ/количество мест/место проведения/название игры`'
      );
      return;
    }

    const gameData = parseGameCommand(commandText);
    if (gameData) {
      await this.gameService.createGame(chatId, { ...gameData, chat_id: chatId }, this.bot);
    }
  }

  private async handleShowGames(chatId: number): Promise<void> {
    await this.gameService.showGames(chatId, this.bot);
  }

  private async handleDeactiveGames(chatId: number, isAdmin: boolean): Promise<void> {
    await this.gameService.deactivateGames(chatId, isAdmin, this.bot);
  }

  private async handleList(chatId: number): Promise<void> {
    await this.gameService.showGamePlayers(chatId, this.bot);
  }

  private async handleAddGuest(msg: Message): Promise<void> {
    // Implementation for adding guest
    await this.bot.sendMessage(msg.chat.id, 'Функция добавления гостя в разработке');
  }

  private async handleAgilliOl(chatId: number): Promise<void> {
    const result = await this.userService.getRandomUserMessage(chatId);
    await this.bot.sendMessage(chatId, result, { parse_mode: 'HTML' });
  }

  private async handleTagGamers(chatId: number, isAdmin: boolean): Promise<void> {
    const result = await this.gameService.tagGamePlayers(chatId, isAdmin);
    await this.bot.sendMessage(chatId, result, { parse_mode: 'HTML' });
  }
}
