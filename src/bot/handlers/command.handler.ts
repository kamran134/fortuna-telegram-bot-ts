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
import { AdminGroupService } from '../../services/adminGroup.service';
import { validateGameFormat, parseGameCommand } from '../../utils/validator';
import { Messages } from '../../constants/messages';
import { botConfig, GAMES_TOPIC_ID } from '../../config/bot';

export class CommandHandler {
  private userService: UserService;
  private gameService: GameService;
  private adminGroupService: AdminGroupService;
  private jokeRepository: JokeRepository;

  constructor(pool: Pool, private bot: TelegramBot) {
    const userRepo = new UserRepository(pool);
    const gameRepo = new GameRepository(pool);
    const gamePlayerRepo = new GamePlayerRepository(pool);
    const jokeRepo = new JokeRepository(pool);
    const adminGroupRepo = new AdminGroupRepository(pool);

    this.userService = new UserService(userRepo, jokeRepo);
    this.gameService = new GameService(gameRepo, gamePlayerRepo, userRepo, jokeRepo);
    this.adminGroupService = new AdminGroupService(adminGroupRepo);
    this.jokeRepository = jokeRepo;
  }

  private isCreator(userId: number): boolean {
    return botConfig.creatorIds.includes(userId);
  }

  /**
   * Handle incoming messages
   */
  async handleMessage(msg: Message): Promise<void> {
    const chatId = msg.chat.id;
    const userId = msg.from?.id;
    const user = msg.from;
    const messageThreadId = msg.message_thread_id; // Get thread ID for topic support
    
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
        await this.handleRegister(chatId, user, messageThreadId);
      } else if (messageText === '/menu') {
        await this.handleMenu(chatId, messageThreadId);
      } else if (messageText === '/tagregistered') {
        await this.handleTagRegistered(chatId, isAdmin, messageThreadId);
      } else if (messageText === '/showregistered') {
        await this.handleShowRegistered(chatId, isAdmin, messageThreadId);
      } else if (messageText.startsWith('/startgame')) {
        await this.handleStartGame(msg, isAdmin);
      } else if (messageText === '/showgames') {
        await this.handleShowGames(chatId, messageThreadId);
      } else if (messageText === '/deactivegame') {
        await this.handleDeactiveGames(chatId, isAdmin, messageThreadId);
      } else if (messageText === '/list') {
        await this.handleList(chatId, messageThreadId);
      } else if (messageText.startsWith('/addguest') && isAdmin) {
        await this.handleAddGuest(msg);
      } else if (messageText.startsWith('/addguest') && !isAdmin) {
        await this.bot.sendMessage(chatId, 'Только одмэн может добавлять гостя в игру. Обратитесь к одмэну.',
          messageThreadId ? { message_thread_id: messageThreadId } : {});
      } else if (messageText.startsWith('/changelimit') && isAdmin) {
        await this.handleChangeLimit(msg);
      } else if (messageText.startsWith('/changelimit') && !isAdmin) {
        await this.bot.sendMessage(chatId, 'Я, конечно, всё понимаю, ну кроме квантовой физики и степени твоей наглости 🤨',
          messageThreadId ? { message_thread_id: messageThreadId } : {});
      } else if (messageText === '/agilliol' || messageText === '/ağıllı ol') {
        await this.handleAgilliOl(chatId, messageThreadId);
      } else if (messageText === '/taggamers') {
        await this.handleTagGamers(chatId, isAdmin, messageThreadId);
      } else if (messageText === '/getgroupid' && isAdmin) {
        await this.bot.sendMessage(userId, `ID вашей группы ${chatId}`);
      } else if (messageText.includes('во ск')) {
        await this.handleWhatTime(chatId, messageThreadId);
      } else if (messageText.startsWith('/adminedituser')) {
        await this.handleEditUser(msg, isAdmin);
      } else if (messageText === '/tagundecided' && isAdmin) {
        await this.handleTagUndecided(chatId, messageThreadId);
      } else if (messageText === '/tagundecided' && !isAdmin) {
        await this.bot.sendMessage(chatId, 'Только одмэн может пошевелить всех!',
          messageThreadId ? { message_thread_id: messageThreadId } : {});
      } else if (messageText.startsWith('/confirmguest') && isAdmin) {
        await this.handleConfirmGuest(msg, messageThreadId);
      } else if (messageText.startsWith('/confirmguest') && !isAdmin) {
        await this.bot.sendMessage(chatId, 'Только одмэн может подтверждать игроков!',
          messageThreadId ? { message_thread_id: messageThreadId } : {});
      } else if (messageText === 'приффки' && user) {
        await this.bot.sendMessage(chatId, `ПрИфФкИ, ${user.first_name}. КаК дЕлИфФкИ. (Что за ванилька из начала нулевых?)`,
          messageThreadId ? { message_thread_id: messageThreadId } : {});
      } else if (messageText === 'привет' && user) {
        await this.bot.sendMessage(chatId, `Привет, ${user.first_name}. Играть будем?`);
      } else if (messageText === 'пока' && user) {
        await this.bot.sendMessage(chatId, `До свидания, ${user.first_name}`);
      } else if (messageText === '/алохамора' && user) {
        await this.bot.sendMessage(chatId, `Нет, ${user.first_name}. Это заклинание не откроет тебе двери в админ-панель...`, { reply_to_message_id: msg.message_id });
      } else if (messageText.includes('авада кедавра') || messageText.includes('авадакедавра')) {
        await this.bot.sendMessage(chatId, `De "sən öl"`, { reply_to_message_id: msg.message_id });
      } else if (messageText.toLowerCase().includes('твой бот')) {
        await this.bot.sendMessage(chatId, `Чтоооо? 😳`, { reply_to_message_id: msg.message_id });
      } else if (messageText.includes('заткнись')) {
        await this.bot.sendMessage(chatId, 'Не понял! Что за телячьи нежности? 🤨');
      } else if (messageText.startsWith('а вы рыбов продоете') || messageText.startsWith('а вы рыбов продоёте')) {
        await this.bot.sendMessage(chatId, 'Нет, показываем.', { reply_to_message_id: msg.message_id });
      } else if (messageText.startsWith('/adminaddjoke')) {
        await this.handleAddJoke(msg, userId);
      } else if (messageText.startsWith('/admindeletejoke')) {
        await this.handleDeleteJoke(msg, userId);
      } else if (messageText.startsWith('/adminlistjokes')) {
        await this.handleListJokes(msg, userId);
      } else if (messageText.startsWith('/admineditjoke')) {
        await this.handleEditJoke(msg, userId);
      } else if (messageText.startsWith('/connectto')) {
        await this.handleConnectTo(msg, userId);
      } else if (messageText === '/showgroups') {
        await this.handleShowGroups(chatId);
      } else if (messageText === '/adminstartgame') {
        await this.handleAdminStartGame(chatId);
      } else if (messageText === '/admindeactivegame') {
        await this.handleAdminDeactiveGame(chatId);
      } else if (messageText === '/adminshowusers') {
        await this.handleAdminShowUsers(chatId);
      } else if (messageText === '/admintaggamers') {
        await this.handleAdminTagGamers(chatId);
      } else if (messageText.startsWith('/sayprivate')) {
        await this.handleSayPrivate(msg);
      }
      // Add more command handlers as needed
    } catch (error) {
      console.error('Command handling error:', error);
      await this.bot.sendMessage(chatId, Messages.ERROR_OCCURRED);
    }
  }

  private async handleRegister(chatId: number, user: TelegramBot.User, messageThreadId?: number): Promise<void> {
    const result = await this.userService.registerUser({
      user_id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      username: user.username,
      chat_id: chatId,
    });
    await this.bot.sendMessage(chatId, result,
      messageThreadId ? { message_thread_id: messageThreadId } : {});
  }

  private async handleMenu(chatId: number, messageThreadId?: number): Promise<void> {
    const keyboard = {
      inline_keyboard: [
        [{ text: '📋 Показать игры', callback_data: 'showgames' }],
        [{ text: '👥 Список игроков', callback_data: 'list' }],
        [{ text: '✅ Регистрация', callback_data: 'register' }],
        [{ text: '🧠 Ağıllı ol', callback_data: 'agilliol' }],
      ],
    };
    await this.bot.sendMessage(chatId, '📱 Главное меню:', { 
      reply_markup: keyboard,
      ...(messageThreadId ? { message_thread_id: messageThreadId } : {}),
    });
  }

  private async handleTagRegistered(chatId: number, isAdmin: boolean, messageThreadId?: number): Promise<void> {
    const result = await this.userService.getRegisteredUsers(chatId, 'tag', isAdmin);
    await this.bot.sendMessage(chatId, result, { 
      parse_mode: 'HTML',
      ...(messageThreadId ? { message_thread_id: messageThreadId } : {}),
    });
  }

  private async handleShowRegistered(chatId: number, isAdmin: boolean, messageThreadId?: number): Promise<void> {
    const result = await this.userService.getRegisteredUsers(chatId, 'show', isAdmin);
    await this.bot.sendMessage(chatId, result, { 
      parse_mode: 'HTML',
      ...(messageThreadId ? { message_thread_id: messageThreadId } : {}),
    });
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
      // Check if this is from admin chat and use selected group
      const g = global as typeof globalThis & { selectedChatForStartGame?: Record<number, number> };
      const targetChatId = g.selectedChatForStartGame?.[chatId] || chatId;
      
      // Always post game announcements to the games topic
      await this.gameService.createGame(targetChatId, { ...gameData, chat_id: targetChatId }, this.bot, GAMES_TOPIC_ID);
      
      // Clear selected chat after game creation
      if (g.selectedChatForStartGame?.[chatId]) {
        delete g.selectedChatForStartGame[chatId];
      }
    }
  }

  private async handleShowGames(chatId: number, messageThreadId?: number): Promise<void> {
    await this.gameService.showGames(chatId, this.bot, messageThreadId);
  }

  private async handleDeactiveGames(chatId: number, isAdmin: boolean, messageThreadId?: number): Promise<void> {
    await this.gameService.deactivateGames(chatId, isAdmin, this.bot, messageThreadId);
  }

  private async handleList(chatId: number, messageThreadId?: number): Promise<void> {
    await this.gameService.showGamePlayers(chatId, this.bot, messageThreadId);
  }

  private async handleAddGuest(msg: Message): Promise<void> {
    const chatId = msg.chat.id;
    const messageText = msg.text?.toLowerCase().replace('@fortunavolleybalbot', '') || '';
    const query = messageText.replace('/addguest ', '');
    const parts = query.split('/');

    if (parts.length < 2) {
      await this.bot.sendMessage(chatId, 'Формат: /addguest название_игры/Имя Фамилия или /addguest название_игры/Имя Фамилия/* (если не точно)');
      return;
    }

    const gameLabel = parts[0];
    const fullname = parts[1].charAt(0).toUpperCase() + parts[1].slice(1);
    const confirmedAttendance = parts.length > 2 && parts[2].includes('*') ? false : true;

    await this.gameService.addGuestToGame(chatId, gameLabel, fullname, confirmedAttendance, this.bot);
  }

  private async handleChangeLimit(msg: Message): Promise<void> {
    const chatId = msg.chat.id;
    const parts = msg.text?.replace('/changelimit ', '').split('/') || [];

    if (parts.length !== 2) {
      await this.bot.sendMessage(chatId, 'Неверный формат. Правильный формат: `/changelimit [название игры]/[новый лимит]`');
      return;
    }

    const label = parts[0];
    const limit = parseInt(parts[1]);

    if (isNaN(limit)) {
      await this.bot.sendMessage(chatId, 'Лимит должен быть числом');
      return;
    }

    await this.gameService.changeGameLimit(chatId, label, limit, this.bot);
  }

  private async handleAgilliOl(chatId: number, messageThreadId?: number): Promise<void> {
    const result = await this.userService.getRandomUserMessage(chatId);
    await this.bot.sendMessage(chatId, result, { 
      parse_mode: 'HTML',
      ...(messageThreadId ? { message_thread_id: messageThreadId } : {}),
    });
  }

  private async handleTagGamers(chatId: number, isAdmin: boolean, messageThreadId?: number): Promise<void> {
    const result = await this.gameService.tagGamePlayers(chatId, isAdmin);
    await this.bot.sendMessage(chatId, result, { 
      parse_mode: 'HTML',
      ...(messageThreadId ? { message_thread_id: messageThreadId } : {}),
    });
  }

  private async handleWhatTime(chatId: number, messageThreadId?: number): Promise<void> {
    await this.gameService.showGamesTimes(chatId, this.bot, messageThreadId);
  }

  private async handleEditUser(msg: Message, isAdmin: boolean): Promise<void> {
    const chatId = msg.chat.id;
    
    if (!isAdmin) {
      await this.bot.sendMessage(chatId, 'Только админ может редактировать пользователей!');
      return;
    }

    const userOptionsString = msg.text?.replace('/adminedituser ', '').replace('/adminedituser@fortunavolleybalbot ', '') || '';
    const parts = userOptionsString.split('/');
    
    if (parts.length < 2) {
      await this.bot.sendMessage(chatId, 'Формат: /adminedituser userId/firstName/lastName/fullnameAz');
      return;
    }

    const [userId, firstName, lastName, fullnameAz] = parts;
    const result = await this.userService.updateUserInfo({
      id: parseInt(userId),
      firstName,
      lastName,
      fullnameAz
    });

    await this.bot.sendMessage(chatId, result);
  }

  private async handleTagUndecided(chatId: number, messageThreadId?: number): Promise<void> {
    await this.gameService.tagUndecidedPlayers(chatId, this.bot, messageThreadId);
  }

  private async handleConfirmGuest(msg: Message, messageThreadId?: number): Promise<void> {
    const chatId = msg.chat.id;
    const messageText = msg.text?.toLowerCase().replace('@fortunavolleybalbot', '') || '';
    const gameLabel = messageText.replace('/confirmguest ', '').trim();

    if (!gameLabel || gameLabel === '/confirmguest') {
      await this.bot.sendMessage(
        chatId,
        'Формат команды: /confirmguest название_игры\n\nНапример: /confirmguest среда',
        messageThreadId ? { message_thread_id: messageThreadId } : {}
      );
      return;
    }

    await this.gameService.showUndecidedPlayersForConfirmation(chatId, gameLabel, this.bot, messageThreadId);
  }

  private async handleAddJoke(msg: Message, userId: number): Promise<void> {
    const chatId = msg.chat.id;

    if (!this.isCreator(userId)) {
      await this.bot.sendMessage(chatId, 'Такую ответственную работу, как пополнить базу шутками мы могли доверить только истинным юмористам. Поэтому никто кроме создателей бота не может увлекаться этим!');
      return;
    }

    const parts = msg.text?.replace('/adminaddjoke ', '').split('/') || [];
    if (parts.length < 1) {
      await this.bot.sendMessage(chatId, 'Формат: /adminaddjoke текст_шутки/тип (тип необязателен, по умолчанию 0)');
      return;
    }

    const joke = parts[0];
    const jokeType = parts.length > 1 ? parseInt(parts[1]) : 0;

    if (isNaN(jokeType)) {
      await this.bot.sendMessage(chatId, 'Тип шутки должен быть числом');
      return;
    }

    try {
      await this.jokeRepository.addJoke({ joke, type: jokeType });
      await this.bot.sendMessage(chatId, `Ваша гениальная "шутка" добавлена в базу данных. Полюбуйтесь на неё ещё раз: ${joke}`);
    } catch (error) {
      await this.bot.sendMessage(chatId, `Ваша гениальная "шутка" не добавилась. Возможно она слишком тупая. А возможно возникла ошибка`);
      console.error('ADD JOKE ERROR:', error);
    }
  }

  private async handleDeleteJoke(msg: Message, userId: number): Promise<void> {
    const chatId = msg.chat.id;

    if (!this.isCreator(userId)) {
      await this.bot.sendMessage(chatId, 'Гениальные шутки создателей могут удалять только такие же гениальные юмористы, то есть сами создатели!');
      return;
    }

    const jokeId = parseInt(msg.text?.replace('/admindeletejoke ', '') || '0');
    
    if (!Number.isInteger(jokeId) || jokeId === 0) {
      await this.bot.sendMessage(chatId, 'Чеееел, у нас в базе id-шки это целые числа, а ты какую-то хероту написал!');
      return;
    }

    try {
      await this.jokeRepository.deleteJoke(jokeId);
      await this.bot.sendMessage(chatId, 'Видимо шутка была не очень. Вы её успешно удалили!');
    } catch (error) {
      await this.bot.sendMessage(chatId, 'Не удалось удалить шутку');
      console.error('DELETE JOKE ERROR:', error);
    }
  }

  private async handleListJokes(msg: Message, userId: number): Promise<void> {
    const chatId = msg.chat.id;

    if (!this.isCreator(userId)) {
      await this.bot.sendMessage(chatId, 'Только истинным юмористам разрешается посетить этот тайный мир шуток!');
      return;
    }

    const jokeType = parseInt(msg.text?.replace('/adminlistjokes ', '') || '0');

    if (!Number.isInteger(jokeType)) {
      await this.bot.sendMessage(chatId, 'Номер категории шуток это целые числа. А ты ввёл фиг знает что!');
      return;
    }

    try {
      const jokes = await this.jokeRepository.getJokes(jokeType);
      if (jokes.length === 0) {
        await this.bot.sendMessage(chatId, 'Нет шуток в этой категории');
        return;
      }

      const jokesText = jokes.map(j => `id: ${j.id} - шутка: ${j.joke} - категория: ${j.type}`).join('\n');
      await this.bot.sendMessage(chatId, jokesText);
    } catch (error) {
      await this.bot.sendMessage(chatId, 'Шутки от нас скрываются из-за ошибки');
      console.error('LIST JOKES ERROR:', error);
    }
  }

  private async handleEditJoke(msg: Message, userId: number): Promise<void> {
    const chatId = msg.chat.id;

    if (!this.isCreator(userId)) {
      await this.bot.sendMessage(chatId, 'Только истинные юмористы могут редактировать шутки друг друга. А остальным следует пройти курс у лучших!');
      return;
    }

    const parts = msg.text?.replace('/admineditjoke ', '').split('/') || [];

    if (parts.length < 2) {
      await this.bot.sendMessage(chatId, 'Формат: /admineditjoke id/новый_текст/тип (тип необязателен, по умолчанию 0)');
      return;
    }

    const id = parseInt(parts[0]);
    const joke = parts[1];
    const jokeType = parts.length > 2 ? parseInt(parts[2]) : 0;

    if (!Number.isInteger(id) || !Number.isInteger(jokeType)) {
      await this.bot.sendMessage(chatId, 'Либо id-шка, либо категория шуток не целочисленное выражение. Исправь!');
      return;
    }

    try {
      await this.jokeRepository.updateJoke({ id, joke, type: jokeType });
      await this.bot.sendMessage(chatId, 'Видимо шутка была не очень. Вы её сделали очень!');
    } catch (error) {
      await this.bot.sendMessage(chatId, 'Эта шутка не подлежит редактированию из-за гениальности, либо у вас ошибка');
      console.error('EDIT JOKE ERROR:', error);
    }
  }

  // =========== ADMIN GROUPS COMMANDS ===========

  private async handleConnectTo(msg: Message, userId: number): Promise<void> {
    const chatId = msg.chat.id;
    const parts = msg.text?.replace('/connectto ', '').split(' ') || [];

    if (parts.length === 0 || !parts[0]) {
      await this.bot.sendMessage(chatId, 'Формат: /connectto chatId');
      return;
    }

    const gameChatId = parseInt(parts[0]);

    if (!Number.isInteger(gameChatId)) {
      await this.bot.sendMessage(chatId, 'Chat ID должен быть числом');
      return;
    }

    await this.adminGroupService.connectToGroup(gameChatId, chatId, userId, this.bot);
  }

  private async handleShowGroups(chatId: number): Promise<void> {
    await this.adminGroupService.showGroups(chatId, this.bot);
  }

  // =========== ADMIN COMMANDS FROM ADMIN CHAT ===========

  private async handleAdminStartGame(adminChatId: number): Promise<void> {
    await this.adminGroupService.showGroupsForSelection(adminChatId, 'StartGame', this.bot);
  }

  private async handleAdminDeactiveGame(adminChatId: number): Promise<void> {
    await this.adminGroupService.showGroupsForSelection(adminChatId, 'DeactiveGame', this.bot);
  }

  private async handleAdminShowUsers(adminChatId: number): Promise<void> {
    await this.adminGroupService.showGroupsForSelection(adminChatId, 'ShowUsers', this.bot);
  }

  private async handleAdminTagGamers(adminChatId: number): Promise<void> {
    await this.adminGroupService.showGroupsForSelection(adminChatId, 'TagGamers', this.bot);
  }

  // =========== SAY PRIVATE ===========

  private async handleSayPrivate(msg: Message): Promise<void> {
    const chatId = msg.chat.id;
    const parts = msg.text?.replace('/sayprivate ', '').split(' ') || [];

    if (parts.length < 2) {
      await this.bot.sendMessage(chatId, 'Формат: /sayprivate @username сообщение');
      return;
    }

    const username = parts[0].replace('@', '');
    const message = parts.slice(1).join(' ');

    const keyboard = {
      inline_keyboard: [
        [{ text: 'Показать сообщение', callback_data: `showPrivate_${username}` }]
      ]
    };

    await this.bot.sendMessage(chatId, `@${username}, вам личное сообщение!`, {
      reply_markup: keyboard
    });

    // Store message for callback - in production you'd use Redis or DB
    // For now we'll handle it in callback handler via a module-level Map
    const g = global as typeof globalThis & { privateMessages?: Record<string, string> };
    g.privateMessages = g.privateMessages || {};
    g.privateMessages[username] = message;
  }
}
