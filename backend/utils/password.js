// utils/password.js
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 12;
const BCRYPT_HASH = /^\$2[aby]\$\d{2}\$/;

const hashPassword = (password) => bcrypt.hash(password, SALT_ROUNDS);

// Accounts created before hashing was added still hold a plaintext password.
// Those are accepted once and upgraded to a bcrypt hash on the spot.
const verifyPassword = async (user, password) => {
  if (BCRYPT_HASH.test(user.password)) {
    return bcrypt.compare(password, user.password);
  }

  if (password !== user.password) return false;
  user.password = await hashPassword(password);
  await user.save();
  return true;
};

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

module.exports = { hashPassword, verifyPassword, isNonEmptyString };
