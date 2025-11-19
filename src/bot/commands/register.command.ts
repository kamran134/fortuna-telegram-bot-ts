/**
 * Register command - registers a user in the system
 */

import { BaseCommand } from './base.command';
import { CommandContext } from '../../types/command.types';

export class RegisterCommand extends BaseCommand {
  readonly name = '/register';
  readonly description = 'Зарегистрироваться в системе';

  async execute(context: CommandContext): Promise<void> {
    const result = await context.userService.registerUser({
      user_id: context.userId,
      first_name: context.user?.first_name || '',
      last_name: context.user?.last_name,
      username: context.user?.username,
      chat_id: context.chatId,
    });

    await context.bot.sendMessage(
      context.chatId,
      result,
      context.messageThreadId ? { message_thread_id: context.messageThreadId } : {}
    );
  }
}
