/**
 * Joke repository - handles jokes database operations
 */

import { Pool } from 'pg';
import { Joke, CreateJokeDto, UpdateJokeDto, JokeType } from '../../types/admin.types';

export class JokeRepository {
  constructor(private pool: Pool) {}

  /**
   * Get random joke by type
   */
  async getJoke(jokeType: JokeType): Promise<string> {
    try {
      const result = await this.pool.query<{ joke: string }>(
        'SELECT joke FROM jokes WHERE type = $1 ORDER BY RANDOM() LIMIT 1',
        [jokeType]
      );
      return result.rows[0]?.joke || '';
    } catch (error) {
      console.error('GET JOKE ERROR:', error);
      throw error;
    }
  }

  /**
   * Get all jokes by type
   */
  async getJokes(jokeType: JokeType): Promise<Joke[]> {
    try {
      const result = await this.pool.query<Joke>(
        'SELECT * FROM jokes WHERE type = $1',
        [jokeType]
      );
      return result.rows;
    } catch (error) {
      console.error('GET JOKES ERROR:', error);
      throw error;
    }
  }

  /**
   * Add a new joke
   */
  async addJoke(dto: CreateJokeDto): Promise<void> {
    const { joke, type } = dto;

    try {
      await this.pool.query(
        'INSERT INTO jokes (joke, type) VALUES ($1, $2)',
        [joke, type]
      );
    } catch (error) {
      console.error('ADD JOKE ERROR:', error);
      throw error;
    }
  }

  /**
   * Update a joke
   */
  async updateJoke(dto: UpdateJokeDto): Promise<void> {
    const { id, joke, type } = dto;

    try {
      await this.pool.query(
        'UPDATE jokes SET joke = $1, type = $2 WHERE id = $3',
        [joke, type, id]
      );
    } catch (error) {
      console.error('UPDATE JOKE ERROR:', error);
      throw error;
    }
  }

  /**
   * Delete a joke
   */
  async deleteJoke(jokeId: number): Promise<void> {
    try {
      await this.pool.query('DELETE FROM jokes WHERE id = $1', [jokeId]);
    } catch (error) {
      console.error('DELETE JOKE ERROR:', error);
      throw error;
    }
  }

  /**
   * Get random joke by type (returns full Joke object)
   */
  async getRandomJoke(jokeType: JokeType): Promise<Joke | null> {
    try {
      const result = await this.pool.query<Joke>(
        'SELECT * FROM jokes WHERE type = $1 ORDER BY RANDOM() LIMIT 1',
        [jokeType]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error('GET RANDOM JOKE ERROR:', error);
      throw error;
    }
  }
}
