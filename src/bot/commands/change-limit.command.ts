/**
 * Change Limit command - changes player limit for a game
 */

import { BaseCommand } from './base.command';
import { CommandContext } from '../../types/command.types';
import { Messages } from '../../constants/messages';

export class ChangeLimitCommand extends BaseCommand {
  readonly name = '/changelimit';
  readonly description = 'Изменить лимит игроков на игру';
  readonly adminOnly = true;

  async execute(context: CommandContext): Promise<void> {
    if (!this.checkPermission(context)) {
      await this.sendPermissionDenied(context, Messages.ARROGANCE_QUANTUM);
      return;
    }

    const parts = context.messageText.replace('/changelimit ', '').split('/');

    if (parts.length !== 2) {
      await context.bot.sendMessage(context.chatId, Messages.INVALID_LIMIT_FORMAT);
      return;
    }

    const label = parts[0];
    const limit = parseInt(parts[1]);

    if (isNaN(limit)) {
      await context.bot.sendMessage(context.chatId, Messages.LIMIT_MUST_BE_NUMBER);
      return;
    }

    await context.gameService.changeGameLimit(context.chatId, label, limit);
  }
}
