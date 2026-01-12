const { app } = require('../server');

module.exports = (req, res) => {
    // Vercel serverless function handler
    return app(req, res);
};
