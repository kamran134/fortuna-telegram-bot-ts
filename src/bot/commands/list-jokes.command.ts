/**
 * List Jokes command - shows all jokes
 */

import { BaseCommand } from './base.command';
import { CommandContext } from '../../types/command.types';
import { Messages } from '../../constants/messages';
import { JokeType } from '../../types/admin.types';
import { logger } from '../../utils/logger';

export class ListJokesCommand extends BaseCommand {
  readonly name = '/adminlistjokes';
  readonly description = 'Показать все шутки';
  readonly creatorOnly = true;

  async execute(context: CommandContext): Promise<void> {
    if (!this.checkPermission(context)) {
      await this.sendPermissionDenied(context, Messages.CREATOR_ONLY);
      return;
    }

    try {
      // Get all joke types and their jokes
      const types: JokeType[] = [
        JokeType.LEFT_GAME,
        JokeType.TAG_REGISTERED,
        JokeType.START_GAME,
        JokeType.DEACTIVE_GAME,
        JokeType.ADD_GUEST,
        JokeType.SAY_SOMETHING_TO_INACTIVE,
        JokeType.DELETE_PLAYER,
        JokeType.TAG_UNDECIDED
      ];

      let allJokes: Array<{ id: number; type: JokeType; joke: string }> = [];

      for (const type of types) {
        const jokes = await context.jokeRepository.getJokes(type);
        allJokes = allJokes.concat(jokes);
      }
      
      if (!allJokes || allJokes.length === 0) {
        await context.bot.sendMessage(context.chatId, 'Шуток нет. Как и у тебя 🙃');
        return;
      }

      const jokesList = allJokes
        .map((joke) => `ID: ${joke.id}\nТип: ${joke.type}\nШутка: ${joke.joke}`)
        .join('\n\n---\n\n');

      await context.bot.sendMessage(context.chatId, jokesList);
    } catch (error) {
      await context.bot.sendMessage(context.chatId, Messages.ERROR_OCCURRED);
      logger.error('LIST JOKES ERROR:', error);
    }
  }
}
