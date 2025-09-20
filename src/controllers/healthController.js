'use strict';

module.exports = {
  async health(req, res) {
    try {
      // check DB connectivity with a short timeout
      const models = req.app.get('models');
      if (!models || !models.sequelize) {
        return res.status(500).json({ status: 'error', db: 'not-configured' });
      }

      // Try authenticate
      await models.sequelize.authenticate();

      return res.status(200).json({ status: 'ok', db: 'ok' });
    } catch (err) {
      return res.status(500).json({ status: 'error', db: 'error', message: err.message });
    }
  }
};
