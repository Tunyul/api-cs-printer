// Centralized auth configuration
const JWT_SECRET = process.env.JWT_SECRET || 'secretkey';

module.exports = {
  JWT_SECRET
};
