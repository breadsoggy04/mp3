/*
 * Connect all of your endpoints together here.
 */
const express = require('express');
const router = express.Router();
require('./home.js')(router);

module.exports = function(app) {
    app.use('/api', router);
    app.use('/api/users', require('./users.js'));
    app.use('/api/tasks', require('./tasks.js'));
};
