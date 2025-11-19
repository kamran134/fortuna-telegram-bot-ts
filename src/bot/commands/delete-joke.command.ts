/**
 * Delete Joke command - deletes a joke from the database
 */

import { BaseCommand } from './base.command';
import { CommandContext } from '../../types/command.types';
import { Messages } from '../../constants/messages';
import { logger } from '../../utils/logger';

export class DeleteJokeCommand extends BaseCommand {
  readonly name = '/admindeletejoke';
  readonly description = 'Удалить шутку из базы';
  readonly creatorOnly = true;

  async execute(context: CommandContext): Promise<void> {
    if (!this.checkPermission(context)) {
      await this.sendPermissionDenied(context, Messages.CREATOR_ONLY_DELETE_JOKES);
      return;
    }

    const jokeId = context.messageText
      .replace('/admindeletejoke ', '')
      .replace('/admindeletejoke@fortunavolleybalbot ', '')
      .trim();

    try {
      await context.jokeRepository.deleteJoke(parseInt(jokeId));
      await context.bot.sendMessage(context.chatId, 'Шутка удалена! Слава богу 😮‍💨');
    } catch (error) {
      await context.bot.sendMessage(context.chatId, 'Не удалось удалить шутку');
      logger.error('DELETE JOKE ERROR:', error);
    }
  }
}
