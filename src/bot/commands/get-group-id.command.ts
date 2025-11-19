/**
 * Get Group ID command - shows chat ID for admin
 */

import { BaseCommand } from './base.command';
import { CommandContext } from '../../types/command.types';

export class GetGroupIdCommand extends BaseCommand {
  readonly name = '/getgroupid';
  readonly description = 'Получить ID группы';
  readonly adminOnly = true;

  async execute(context: CommandContext): Promise<void> {
    if (!this.checkPermission(context)) {
      await this.sendPermissionDenied(context);
      return;
    }

    await context.bot.sendMessage(context.userId, `ID вашей группы ${context.chatId}`);
  }
}
