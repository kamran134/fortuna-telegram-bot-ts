/**
 * Admin Group repository - handles admin groups database operations
 */

import { Pool } from 'pg';
import { AdminGroup, CreateAdminGroupDto } from '../../types/admin.types';
import { logger } from '../../utils/logger';

export class AdminGroupRepository {
  constructor(private pool: Pool) {}

  /**
   * Add admin group
   */
  async addAdminGroup(dto: CreateAdminGroupDto): Promise<void> {
    const { chatId, adminChatId, groupName } = dto;

    try {
      await this.pool.query(
        `INSERT INTO admin_groups (chat_id, admin_chat_id, group_name) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (chat_id, admin_chat_id) DO NOTHING`,
        [chatId, adminChatId, groupName]
      );
    } catch (error) {
      logger.error('ADD ADMIN GROUP ERROR:', error);
      throw error;
    }
  }

  /**
   * Get all groups managed by an admin
   */
  async getGroups(adminChatId: number): Promise<AdminGroup[]> {
    try {
      const result = await this.pool.query<AdminGroup>(
        'SELECT * FROM admin_groups WHERE admin_chat_id = $1',
        [adminChatId]
      );
      return result.rows;
    } catch (error) {
      logger.error('GET GROUPS ERROR:', error);
      throw error;
    }
  }

  /**
   * Check if user is admin of a group
   */
  async isAdminOfGroup(adminChatId: number, chatId: number): Promise<boolean> {
    try {
      const result = await this.pool.query(
        'SELECT * FROM admin_groups WHERE admin_chat_id = $1 AND chat_id = $2',
        [adminChatId, chatId]
      );
      return result.rows.length > 0;
    } catch (error) {
      logger.error('CHECK ADMIN ERROR:', error);
      throw error;
    }
  }
}
