/**
 * Edit Joke command - edits a joke in the database
 */

import { BaseCommand } from './base.command';
import { CommandContext } from '../../types/command.types';
import { JokeType } from '../../types/admin.types';
import { Messages } from '../../constants/messages';
import { logger } from '../../utils/logger';

export class EditJokeCommand extends BaseCommand {
  readonly name = '/admineditjoke';
  readonly description = 'Редактировать шутку';
  readonly creatorOnly = true;

  async execute(context: CommandContext): Promise<void> {
    if (!this.checkPermission(context)) {
      await this.sendPermissionDenied(context, Messages.CREATOR_ONLY);
      return;
    }

    const messageText = context.messageText
      .replace('/admineditjoke ', '')
      .replace('/admineditjoke@fortunavolleybalbot ', '');
    
    const parts = messageText.split('///');
    
    if (parts.length < 3) {
      await context.bot.sendMessage(
        context.chatId,
        'Формат: /admineditjoke ID шутки///тип шутки///новый текст'
      );
      return;
    }

    const jokeId = parseInt(parts[0]);
    const jokeType = parts[1] as unknown as JokeType;
    const joke = parts[2];

    try {
      await context.jokeRepository.updateJoke({ id: jokeId, type: jokeType, joke });
      await context.bot.sendMessage(context.chatId, 'Шутка отредактирована!');
    } catch (error) {
      await context.bot.sendMessage(context.chatId, 'Не удалось отредактировать шутку');
      logger.error('EDIT JOKE ERROR:', error);
    }
  }
}
