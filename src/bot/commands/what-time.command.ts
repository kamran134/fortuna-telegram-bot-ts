/**
 * What Time command - shows game start times
 */

import { BaseCommand } from './base.command';
import { CommandContext } from '../../types/command.types';

export class WhatTimeCommand extends BaseCommand {
  readonly name = 'во ск';
  readonly description = 'Во сколько игра?';

  async execute(context: CommandContext): Promise<void> {
    await context.gameService.showGamesTimes(context.chatId, context.messageThreadId);
  }
}
