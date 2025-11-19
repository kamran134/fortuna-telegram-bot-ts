/**
 * Game repository - handles all game-related database operations
 */

import { Pool } from 'pg';
import moment from 'moment';
import { Game, CreateGameDto, ChangeGameLimitDto } from '../../types/game.types';
import { logger } from '../../utils/logger';

export class GameRepository {
  constructor(private pool: Pool) {}

  /**
   * Get all active games in a chat
   */
  async getGames(chatId: number): Promise<Game[]> {
    try {
      const result = await this.pool.query<Game>(
        'SELECT * FROM games WHERE chat_id = $1 AND status = TRUE',
        [chatId]
      );
      return result.rows;
    } catch (error) {
      logger.error('GET GAMES ERROR:', error);
      throw error;
    }
  }

  /**
   * Get game times
   */
  async getGamesTimes(chatId: number): Promise<Array<{ game_starts: string; label: string }>> {
    try {
      const result = await this.pool.query<{ game_starts: string; label: string }>(
        'SELECT game_starts, label FROM games WHERE chat_id = $1 AND status = TRUE',
        [chatId]
      );
      return result.rows;
    } catch (error) {
      logger.error('GET GAMES TIMES ERROR:', error);
      throw error;
    }
  }

  /**
   * Add a new game
   */
  async addGame(chatId: number, dto: CreateGameDto): Promise<number | undefined> {
    const { date, start, end, users_limit, location, label } = dto;

    try {
      // Преобразуем дату в формат YYYY-MM-DD для PostgreSQL DATE типа
      const gameDate = moment(date, 'DD.MM.YYYY').format('YYYY-MM-DD');
      
      const result = await this.pool.query<{ id: number }>(
        `INSERT INTO games (game_date, game_starts, game_ends, users_limit, place, chat_id, status, label) 
         VALUES ($1, $2, $3, $4, $5, $6, TRUE, $7) 
         ON CONFLICT(chat_id, game_date, game_starts, game_ends, place) DO UPDATE SET
           users_limit = EXCLUDED.users_limit,
           status = TRUE,
           label = EXCLUDED.label
         RETURNING id`,
        [gameDate, start, end, users_limit, location, chatId, label]
      );

      return result.rows[0]?.id;
    } catch (error) {
      logger.error('ADD GAME ERROR:', error);
      throw error;
    }
  }

  /**
   * Deactivate a game
   */
  async deactivateGame(gameId: number): Promise<string | null> {
    const client = await this.pool.connect();

    try {
      const result = await client.query<{ label: string }>(
        'UPDATE games SET status = FALSE WHERE id = $1 RETURNING label',
        [gameId]
      );
      return result.rows[0]?.label || null;
    } catch (error) {
      logger.error('DEACTIVATE GAME ERROR:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Delete a game
   */
  async deleteGame(gameId: number): Promise<string | null> {
    const client = await this.pool.connect();

    try {
      // Delete related game_users first
      await client.query('DELETE FROM game_users WHERE game_id = $1', [gameId]);

      // Delete the game
      const result = await client.query<{ label: string }>(
        'DELETE FROM games WHERE id = $1 RETURNING label',
        [gameId]
      );

      return result.rows[0]?.label || null;
    } catch (error) {
      logger.error('DELETE GAME ERROR:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Change game limit
   */
  async changeGameLimit(dto: ChangeGameLimitDto): Promise<string | null> {
    const { chatId, label, limit } = dto;
    const client = await this.pool.connect();

    try {
      const result = await client.query<{ label: string }>(
        'UPDATE games SET users_limit = $1 WHERE chat_id = $2 AND label = $3 RETURNING label',
        [limit, chatId, label]
      );
      return result.rows[0]?.label || null;
    } catch (error) {
      logger.error('CHANGE GAME LIMIT ERROR:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Check game status
   */
  async checkGameStatus(gameId: number): Promise<boolean> {
    const client = await this.pool.connect();

    try {
      const result = await this.pool.query<{ status: boolean }>(
        'SELECT status FROM games WHERE id = $1',
        [gameId]
      );
      return result.rows[0]?.status || false;
    } catch (error) {
      logger.error('CHECK GAME STATUS ERROR:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get game by ID
   */
  async getGameById(gameId: number): Promise<Game | null> {
    try {
      const result = await this.pool.query<Game>(
        'SELECT * FROM games WHERE id = $1',
        [gameId]
      );
      return result.rows[0] || null;
    } catch (error) {
      logger.error('GET GAME BY ID ERROR:', error);
      throw error;
    }
  }

  /**
   * Get all active games (alias for getGames for clarity)
   */
  async getActiveGames(chatId: number): Promise<Game[]> {
    return this.getGames(chatId);
  }
}
