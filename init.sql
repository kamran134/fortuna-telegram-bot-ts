CREATE DATABASE fortuna;
CREATE USER postgres WITH PASSWORD 'plk_S2%92';
GRANT ALL PRIVILEGES ON DATABASE fortuna TO postgres;

\connect fortuna

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT,
    username TEXT,
    is_guest BOOLEAN DEFAULT FALSE,
    chat_id BIGINT,
    fullname_az TEXT,
    active BOOLEAN DEFAULT TRUE,
    UNIQUE (user_id, chat_id)
);

CREATE TABLE IF NOT EXISTS group_users (
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    chat_id BIGINT NOT NULL,
    chat_role TEXT,
    PRIMARY KEY(user_id, chat_id)
);

CREATE TABLE IF NOT EXISTS games (
    id SERIAL PRIMARY KEY,
    chat_id BIGINT NOT NULL,
    game_date DATE,
    game_starts TIME,
    game_ends TIME,
    place TEXT,
    users_limit INT,
    status BOOLEAN DEFAULT TRUE,
    label TEXT,
    UNIQUE(chat_id, game_date, label)
);

CREATE TABLE IF NOT EXISTS game_users (
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    game_id BIGINT REFERENCES games(id) ON DELETE CASCADE,
    participate_time TIMESTAMP DEFAULT NOW(),
    confirmed_attendance BOOLEAN DEFAULT FALSE,
    payed BOOLEAN DEFAULT FALSE,
    PRIMARY KEY(user_id, game_id)
);

CREATE TABLE IF NOT EXISTS game_guests (
    game_id BIGINT REFERENCES games(id) ON DELETE CASCADE,
    fullname TEXT,
    participate_time TIMESTAMP DEFAULT NOW(),
    confirmed_attendance BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS admin_groups (
    id SERIAL PRIMARY KEY,
    chat_id BIGINT UNIQUE NOT NULL,
    admin_chat_id BIGINT,
    group_name TEXT,
    UNIQUE(chat_id, admin_chat_id)
);

CREATE TABLE IF NOT EXISTS jokes (
    id SERIAL PRIMARY KEY,
    joke TEXT NOT NULL,
    type INTEGER DEFAULT 0
);

-- Insert some default jokes
INSERT INTO jokes (joke, type) VALUES 
('Но ты всё равно молодец!', 0),
('Может быть в следующий раз получится!', 0),
('Трусишка? 😏', 2),
('Слабак! 💪', 2);
