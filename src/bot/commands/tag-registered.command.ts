/**
 * Tag Registered command - tags all registered users
 */

import { BaseCommand } from './base.command';
import { CommandContext } from '../../types/command.types';

export class TagRegisteredCommand extends BaseCommand {
  readonly name = '/tagregistered';
  readonly description = 'Упомянуть всех зарегистрированных пользователей';
  readonly adminOnly = true;

  async execute(context: CommandContext): Promise<void> {
    if (!this.checkPermission(context)) {
      await this.sendPermissionDenied(context, 'Только одмэн может массово беспокоить всех!');
      return;
    }

    const result = await context.userService.getRegisteredUsers(context.chatId, 'tag', context.isAdmin);
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
