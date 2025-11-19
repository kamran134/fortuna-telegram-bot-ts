/**
 * Add Joke command - adds a joke to the database
 */

import { BaseCommand } from './base.command';
import { CommandContext } from '../../types/command.types';
import { JokeType } from '../../types/admin.types';
import { Messages } from '../../constants/messages';
import { logger } from '../../utils/logger';

export class AddJokeCommand extends BaseCommand {
  readonly name = '/adminaddjoke';
  readonly description = 'Добавить шутку в базу';
  readonly creatorOnly = true;

  async execute(context: CommandContext): Promise<void> {
    if (!this.checkPermission(context)) {
      await this.sendPermissionDenied(context, Messages.CREATOR_ONLY_JOKES);
      return;
    }

    const messageText = context.messageText
      .replace('/adminaddjoke ', '')
      .replace('/adminaddjoke@fortunavolleybalbot ', '');
    
    const parts = messageText.split('///');
    
    if (parts.length < 2) {
      await context.bot.sendMessage(
        context.chatId,
        'Формат: /adminaddjoke тип шутки///текст шутки\nТипы: DEACTIVE_GAME, TAG_REGISTERED, ADD_GUEST'
      );
      return;
    }

    const jokeType = parts[0] as unknown as JokeType;
    const joke = parts[1];

    try {
      await context.jokeRepository.addJoke({ joke, type: jokeType });
      await context.bot.sendMessage(
        context.chatId,
        `Ваша гениальная "шутка" добавлена в базу данных. Полюбуйтесь на неё ещё раз: ${joke}`
      );
    } catch (error) {
      await context.bot.sendMessage(
        context.chatId,
        `Ваша гениальная "шутка" не добавилась. Возможно она слишком тупая. А возможно возникла ошибка`
      );
      logger.error('ADD JOKE ERROR:', error);
    }
  }
}
