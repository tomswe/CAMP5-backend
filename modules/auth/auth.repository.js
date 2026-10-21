import { db } from '../../config/db.config.js'

export const findUserByEmail = async (email) => {
  const { rows } = await db.query(
    "SELECT * FROM users WHERE email=$1 AND is_deleted=false",
    [email],
  );
  return rows[0];
};

export const findUserById = async (id) => {
  const { rows } = await db.query(
    "SELECT id,email,role FROM users WHERE id=$1 AND is_deleted=false",
    [id],
  );
  return rows[0];
};

export const createUser = async ({ name, email, password, provider }) => {
  const { rows } = await db.query(
    `INSERT INTO users(name,email,password,provider)
     VALUES($1,$2,$3,$4) RETURNING *`,
    [name, email, password, provider],
  );
  return rows[0];
};

// REFRESH TOKEN
export const createRefreshToken = async (userId, token) => {
  await db.query(
    `INSERT INTO refresh_tokens(user_id, token, expires_at)
     VALUES($1,$2,NOW() + INTERVAL '7 days')`,
    [userId, token],
  );
};

export const findRefreshToken = async (token) => {
  const { rows } = await db.query(
    "SELECT * FROM refresh_tokens WHERE token=$1",
    [token],
  );
  return rows[0];
};

export const deleteRefreshToken = async (id) => {
  await db.query("DELETE FROM refresh_tokens WHERE id=$1", [id]);
};

// UPDATE USER
export const updateUser = async (id, data) => {
  const { name, email, password } = data;

  const { rows } = await db.query(
    `UPDATE users SET name = $1, email=COALESCE($2, email), password = COALESCE($3, password) WHERE id = $4 RETURNING id, name, email, role`,
    [name, email, password, id],
  );

  return rows[0];
};

// DELETE ALL SESSIONS (logout semua device)
export const deleteAllUserTokens = async (userId) => {
  await db.query("DELETE FROM refresh_tokens WHERE user_id=$1", [userId]);
};

// DELETE SINGLE TOKEN (logout 1 device)
export const deleteRefreshTokenByToken = async (token) => {
  await db.query("DELETE FROM refresh_tokens WHERE token=$1", [token]);
};