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
import { BotMessenger } from '../../services/bot-messenger.service';
import { Messages } from '../../constants/messages';
import { botConfig } from '../../config/bot';
import { logger } from '../../utils/logger';
import { errorNotifier } from '../../utils/error-notifier';
import { CommandRegistry } from '../command-registry';
import { CommandContext } from '../../types/command.types';
import {
  RegisterCommand,
  MenuCommand,
  ShowGamesCommand,
  ListPlayersCommand,
  TagRegisteredCommand,
  DeactivateGameCommand,
  ActivateGameCommand,
  ShowRegisteredCommand,
  StartGameCommand,
  AddGuestCommand,
  ChangeLimitCommand,
  TagGamersCommand,
  TagUndecidedCommand,
  ConfirmGuestCommand,
  DeleteGuestCommand,
  UnconfirmPlayerCommand,
  AgilliOlCommand,
  GetGroupIdCommand,
  WhatTimeCommand,
  EditUserCommand,
  AddJokeCommand,
  DeleteJokeCommand,
  ListJokesCommand,
  EditJokeCommand,
  ConnectToCommand,
  ShowGroupsCommand,
  AdminStartGameCommand,
  SayPrivateCommand,
  PriffkiCommand,
  HelloCommand,
  ByeCommand,
  AlohomoraCommand,
  AvadaKedavraCommand,
  YourBotCommand,
  ShutUpCommand,
} from '../commands';

export class CommandHandler {
  private userService: UserService;
  private gameService: GameService;
  private adminGroupService: AdminGroupService;
  private jokeRepository: JokeRepository;
  private commandRegistry: CommandRegistry;

  constructor(pool: Pool, private bot: TelegramBot) {
    const userRepo = new UserRepository(pool);
    const gameRepo = new GameRepository(pool);
    const gamePlayerRepo = new GamePlayerRepository(pool);
    const jokeRepo = new JokeRepository(pool);
    const adminGroupRepo = new AdminGroupRepository(pool);
    const botMessenger = new BotMessenger(bot);

    this.userService = new UserService(userRepo, jokeRepo);
    this.gameService = new GameService(gameRepo, gamePlayerRepo, userRepo, jokeRepo, botMessenger);
    this.adminGroupService = new AdminGroupService(adminGroupRepo);
    this.jokeRepository = jokeRepo;

    this.commandRegistry = new CommandRegistry();
    this.registerCommands();
  }

  private isCreator(userId: number): boolean {
    return botConfig.creatorIds.includes(userId);
  }

  private registerCommands(): void {
    this.commandRegistry.registerExact('/register', new RegisterCommand());
    this.commandRegistry.registerExact('/menu', new MenuCommand());
    this.commandRegistry.registerExact('/showgames', new ShowGamesCommand());
    this.commandRegistry.registerExact('/list', new ListPlayersCommand());
    this.commandRegistry.registerPrefix('/startgame', new StartGameCommand());
    this.commandRegistry.registerExact('/deactivegame', new DeactivateGameCommand());
    this.commandRegistry.registerExact('/activategame', new ActivateGameCommand());
    this.commandRegistry.registerContains('во сколько', new WhatTimeCommand());
    this.commandRegistry.registerExact('/showregistered', new ShowRegisteredCommand());
    this.commandRegistry.registerExact('/tagregistered', new TagRegisteredCommand());
    this.commandRegistry.registerPrefix('/addguest', new AddGuestCommand());
    this.commandRegistry.registerPrefix('/changelimit', new ChangeLimitCommand());
    this.commandRegistry.registerExact('/taggamers', new TagGamersCommand());
    this.commandRegistry.registerExact('/tagundecided', new TagUndecidedCommand());
    this.commandRegistry.registerExact('/confirmguest', new ConfirmGuestCommand());
    this.commandRegistry.registerPrefix('/deleteguest', new DeleteGuestCommand());
    this.commandRegistry.registerPrefix('/unconfirmplayer', new UnconfirmPlayerCommand());
    this.commandRegistry.registerPrefix('/adminedituser', new EditUserCommand());
    this.commandRegistry.registerExact('/getgroupid', new GetGroupIdCommand());
    this.commandRegistry.registerPrefix('/connectto', new ConnectToCommand());
    this.commandRegistry.registerExact('/showgroups', new ShowGroupsCommand());
    this.commandRegistry.registerPrefix('/adminstartgame', new AdminStartGameCommand());
    this.commandRegistry.registerPrefix('/sayprivate', new SayPrivateCommand());
    this.commandRegistry.registerPrefix('/adminaddjoke', new AddJokeCommand());
    this.commandRegistry.registerPrefix('/admindeletejoke', new DeleteJokeCommand());
    this.commandRegistry.registerExact('/adminlistjokes', new ListJokesCommand());
    this.commandRegistry.registerPrefix('/admineditjoke', new EditJokeCommand());
    this.commandRegistry.registerExact('/agilliol', new AgilliOlCommand());
    this.commandRegistry.registerContains('приффки', new PriffkiCommand());
    this.commandRegistry.registerContains('привет', new HelloCommand());
    this.commandRegistry.registerContains('пока', new ByeCommand());
    this.commandRegistry.registerContains('алохамора', new AlohomoraCommand());
    this.commandRegistry.registerContains('авада кедавра', new AvadaKedavraCommand());
    this.commandRegistry.registerContains('твой бот', new YourBotCommand());
    this.commandRegistry.registerContains('заткнись', new ShutUpCommand());
    logger.info('All commands registered successfully');
  }

  async handleMessage(msg: Message): Promise<void> {
    const chatId = msg.chat.id;
    const userId = msg.from?.id;
    const user = msg.from;
    const messageThreadId = msg.message_thread_id;
    
    if (!userId || !user) return;

    const messageText = msg.text?.startsWith('/')
      ? msg.text.toLowerCase().replace('@fortunavolleybalbot', '')
      : msg.text?.toLowerCase() || '';

    const chatMember = await this.bot.getChatMember(chatId, userId);
    const isAdmin = chatMember.status === 'administrator' || chatMember.status === 'creator';
    const isCreator = this.isCreator(userId);

    const context: CommandContext = {
      message: msg,
      chatId,
      userId,
      user,
      messageText,
      text: messageText,
      isAdmin,
      isCreator,
      messageThreadId,
      bot: this.bot,
      pool: {} as Pool,
      gameService: this.gameService,
      userService: this.userService,
      adminGroupService: this.adminGroupService,
      jokeRepository: this.jokeRepository,
    };

    try {
      await this.commandRegistry.execute(context);
    } catch (error) {
      logger.error('Command handling error:', error);
      await errorNotifier.notifyError(error as Error, `Command: ${messageText} | Chat: ${chatId}`);
      await this.bot.sendMessage(chatId, Messages.ERROR_OCCURRED);
    }
  }
}