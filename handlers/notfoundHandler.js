const { send } = require('micro');

const notfoundHandler = (req, res) => send(res, 404, `404: requested resource not found at: ${req.method} ${req.url}`);

module.exports = notfoundHandler;