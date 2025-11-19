/**
 * Base command class - abstract class for all bot commands
 */

import { CommandContext, ICommand } from '../../types/command.types';

export abstract class BaseCommand implements ICommand {
  abstract readonly name: string;
  abstract readonly description?: string;
  readonly adminOnly?: boolean = false;
  readonly creatorOnly?: boolean = false;

  abstract execute(context: CommandContext): Promise<void>;

  /**
   * Check if user has permission to execute this command
   */
  protected checkPermission(context: CommandContext): boolean {
    if (this.creatorOnly && !context.isCreator) {
      return false;
    }
    if (this.adminOnly && !context.isAdmin) {
      return false;
    }
    return true;
  }

  /**
   * Send permission denied message
   */
  protected async sendPermissionDenied(context: CommandContext, customMessage?: string): Promise<void> {
    const message = customMessage || 'У вас нет прав для выполнения этой команды.';
    await context.bot.sendMessage(
      context.chatId,
      message,
      context.messageThreadId ? { message_thread_id: context.messageThreadId } : {}
    );
  }
}
