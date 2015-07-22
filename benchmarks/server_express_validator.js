'use strict';

var express = require('express'),
    responseTime = require('response-time'),
    bodyParser = require('body-parser'),
    expressValidator = require('express-validator'),
    app = express();

app.use(responseTime({ suffix: false }));
app.use(bodyParser.json());
app.use(expressValidator({}));

app.post('/items', function (req, res) {
  req.checkBody('name', 'Name required').notEmpty();
  req.checkBody('date', 'Invalid date').isDate();
  req.checkBody('type', 'Invalid type').isIn(['lawn', 'garden', 'tools']);
  req.checkBody('user', 'Invalid user').isEmail();
  req.checkBody('uuid', 'Invalid uuid').optional().isUUID();
  req.checkBody('url', 'Invalid url').optional().isURL();

  var errors = req.validationErrors();
  if (errors) {
    return res.status(400).send({ errors: errors });
  }

  return res.status(200).end();
});

app.get('/items', function (req, res) {
  req.checkQuery('since', 'Invalid since').optional().isDate();
  req.checkQuery('limit', 'Invalid limit').isInt();
  req.checkQuery('page', 'Invalid page').optional().isInt();
  req.checkQuery('sort', 'Sort required').notEmpty();

  var errors = req.validationErrors();
  if (errors) {
    return res.status(400).send({ errors: errors });
  }

  return res.status(200).end();
});

app.get('/items/:item', function (req, res) {
  req.checkParams('item', 'Invalid item').isMongoId();

  var errors = req.validationErrors();
  if (errors) {
    return res.status(400).send({ errors: errors });
  }

  return res.status(200).end();
});

app.listen(3003);

module.exports = app;