/**
 * Menu command - displays bot menu with available commands
 */

import { BaseCommand } from './base.command';
import { CommandContext } from '../../types/command.types';
import { Messages } from '../../constants/messages';

export class MenuCommand extends BaseCommand {
  readonly name = '/menu';
  readonly description = 'Показать меню команд';

  async execute(context: CommandContext): Promise<void> {
    await context.bot.sendMessage(
      context.chatId,
      Messages.MENU,
      context.messageThreadId ? { message_thread_id: context.messageThreadId } : {}
    );
  }
}
