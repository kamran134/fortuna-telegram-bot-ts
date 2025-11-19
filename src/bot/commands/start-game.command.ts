/**
 * Start Game command - creates a new game
 */

import { BaseCommand } from './base.command';
import { CommandContext } from '../../types/command.types';
import { validateGameFormat, parseGameCommand } from '../../utils/validator';
import { Messages } from '../../constants/messages';
import { GAMES_TOPIC_ID } from '../../config/bot';

export class StartGameCommand extends BaseCommand {
  readonly name = '/startgame';
  readonly description = 'Создать новую игру';
  readonly adminOnly = true;

  async execute(context: CommandContext): Promise<void> {
    if (!this.checkPermission(context)) {
      await this.sendPermissionDenied(context, Messages.ADMIN_ONLY);
      return;
    }

    const commandText = context.messageText.replace('/startgame ', '').trim();
    
    if (!validateGameFormat(commandText)) {
      await context.bot.sendMessage(
        context.chatId,
        Messages.INVALID_GAME_FORMAT
      );
      return;
    }

    const gameData = parseGameCommand(commandText);
    if (gameData) {
      // Check if this is from admin chat and use selected group
      const g = global as typeof globalThis & { selectedChatForStartGame?: Record<number, number> };
      const targetChatId = g.selectedChatForStartGame?.[context.chatId] || context.chatId;
      
      // Always post game announcements to the games topic
      await context.gameService.createGame(targetChatId, { ...gameData, chat_id: targetChatId }, GAMES_TOPIC_ID);
      
      // Clear selected chat after game creation
      if (g.selectedChatForStartGame?.[context.chatId]) {
        delete g.selectedChatForStartGame[context.chatId];
      }
    }
  }
}
