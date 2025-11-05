/**
 * Common types used across the application
 */

export type WeekDay = 'понедельник' | 'вторник' | 'среда' | 'четверг' | 'пятница' | 'суббота' | 'воскресенье';

export type Case = 'именительный' | 'родительный' | 'дательный' | 'винительный' | 'творительный' | 'предложный';

export type AzCase = 'именительный' | 'родительный' | 'дательный' | 'винительный' | 'местный' | 'исходный';

export interface MessageResponse {
  success: boolean;
  message: string;
  data?: unknown;
}

export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

export interface UserForTagging {
  first_name: string;
  last_name?: string;
  username?: string;
  is_guest?: boolean;
}

export interface DatabaseConfig {
  user: string;
  host: string;
  database: string;
  password: string;
  port: number;
}

export interface BotConfig {
  token: string;
  creatorIds: number[];
}
