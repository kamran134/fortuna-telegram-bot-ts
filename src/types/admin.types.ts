/**
 * Admin and joke related types
 */

export interface AdminGroup {
  id: number;
  chat_id: number;
  admin_chat_id: number;
  group_name: string;
}

export interface CreateAdminGroupDto {
  chatId: number;
  adminChatId: number;
  groupName: string;
}

export enum JokeType {
  TAG_REGISTERED = 0,
  DEACTIVE_GAME = 1,
  LEFT_GAME = 2,
}

export interface Joke {
  id: number;
  joke: string;
  type: JokeType;
}

export interface CreateJokeDto {
  joke: string;
  type: JokeType;
}

export interface UpdateJokeDto {
  id: number;
  joke: string;
  type: JokeType;
}
