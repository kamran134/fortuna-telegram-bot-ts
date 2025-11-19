/**
 * Tag Undecided command - mentions undecided players
 */

import { BaseCommand } from './base.command';
import { CommandContext } from '../../types/command.types';
import { Messages } from '../../constants/messages';

export class TagUndecidedCommand extends BaseCommand {
  readonly name = '/tagundecided';
  readonly description = 'Упомянуть неопределившихся игроков';
  readonly adminOnly = true;

  async execute(context: CommandContext): Promise<void> {
    if (!this.checkPermission(context)) {
      await this.sendPermissionDenied(context, Messages.ADMIN_ONLY_TAG_UNDECIDED);
      return;
    }

    await context.gameService.tagUndecidedPlayers(context.chatId, context.messageThreadId);
  }
}
