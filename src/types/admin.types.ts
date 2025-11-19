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
  LEFT_GAME = 1,
  TAG_REGISTERED = 2,
  START_GAME = 3,
  DEACTIVE_GAME = 4,
  ADD_GUEST = 5,
  SAY_SOMETHING_TO_INACTIVE = 6,
  DELETE_PLAYER = 7,
  TAG_UNDECIDED = 8,
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
