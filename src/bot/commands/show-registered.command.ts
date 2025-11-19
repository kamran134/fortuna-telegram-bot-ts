/**
 * Show Registered command - displays all registered users
 */

import { BaseCommand } from './base.command';
import { CommandContext } from '../../types/command.types';

export class ShowRegisteredCommand extends BaseCommand {
  readonly name = '/showregistered';
  readonly description = 'Показать всех зарегистрированных пользователей';
  readonly adminOnly = true;

  async execute(context: CommandContext): Promise<void> {
    if (!this.checkPermission(context)) {
      await this.sendPermissionDenied(context, 'Только одмэн может массово беспокоить всех!');
      return;
    }

    const result = await context.userService.getRegisteredUsers(context.chatId, 'show', context.isAdmin);
    await context.bot.sendMessage(
      context.chatId,
      result,
      {
        parse_mode: 'HTML',
        ...(context.messageThreadId ? { message_thread_id: context.messageThreadId } : {}),
      }
    );
  }
}
