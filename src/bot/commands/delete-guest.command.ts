/**
 * Delete Guest command - deletes guests from a game
 */

import { BaseCommand } from './base.command';
import { CommandContext } from '../../types/command.types';
import { Messages } from '../../constants/messages';

export class DeleteGuestCommand extends BaseCommand {
  readonly name = '/deleteguest';
  readonly description = 'Удалить гостя из игры';
  readonly adminOnly = true;

  async execute(context: CommandContext): Promise<void> {
    if (!this.checkPermission(context)) {
      await this.sendPermissionDenied(context, Messages.ADMIN_ONLY_CONFIRM_GUEST);
      return;
    }

    const gameLabel = context.messageText.replace('/deleteguest ', '').trim();

    if (!gameLabel || gameLabel === '/deleteguest') {
      await context.bot.sendMessage(
        context.chatId,
        'Использование: /deleteguest <день недели>\nПример: /deleteguest понедельник',
        context.messageThreadId ? { message_thread_id: context.messageThreadId } : {}
      );
      return;
    }

    await context.gameService.showGuestsForDeletion(
      context.chatId,
      gameLabel,
      context.messageThreadId
    );
  }
}
