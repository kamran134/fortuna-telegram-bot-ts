/**
 * Application messages
 */

export const Messages = {
  // Registration
  REGISTRATION_SUCCESS: '✅ Siz uğurla sistemdə qeydiyyatdan keçdiniz / Вы успешно зарегистрировались в системе',
  USER_ALREADY_IN_GROUP: 'İstifadəçi artıq qrupda var / Пользователь уже существует в группе',
  USER_ADDED_TO_GROUP: '✅ Siz uğurla qrupa əlavə edildiniz / Вы успешно добавлены в группу',
  UNREGISTRATION_SUCCESS: '✅ Siz uğurla sistemdən qeydiyyatdan çıxardınız / Вы успешно удалены из системы',

  // Games
  NO_GAMES: 'Hələki oyun-zad yoxdur / А игр ещё нет 😓',
  NO_PLAYERS: 'Oyuna yazılan yoxdur. Dəhşət. \n Нет записавшихся на игру. Капец.',
  GAME_CREATED: 'Игра успешно создана!',
  GAME_NOT_FOUND: 'Игры не найдено',
  GAME_CLOSED: 'Игра закрыта!',
  GAME_LIMIT_CHANGED: 'Изменено количество игроков на игру',

  // Permissions
  ADMIN_ONLY: 'Только одмэн может выполнить эту команду. Be clever!',
  CREATOR_ONLY: 'Такую ответственную работу мы могли доверить только создателям бота!',

  // Errors
  ERROR_OCCURRED: 'Произошла ошибка. Попробуйте позже.',
  INVALID_FORMAT: 'Введённый формат неверный',
  
  // Other
  NO_REGISTERED_USERS: 'Нет зарегистрированных пользователей. Капец!',
} as const;
