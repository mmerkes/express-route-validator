'use strict';

var express = require('express'),
    bodyParser = require('body-parser'),
    routeValidator = require('../index'),
    app = express();

app.use(bodyParser.json());

app.get('/items', routeValidator.validate({
  query: {
    since: { isDate: true },
    limit: { isInt: true, isRequired: true },
    page: { isInt: true, isRequired: false },
    sort: { isRequired: true }
  }
}), function (req, res) {
  return res.status(200).end();
});

app.get('/items/:item', routeValidator.validate({
  params: {
    item: { isMongoId: true, isRequired: true }
  }
}), function (req, res) {
  return res.status(200).end();
});

app.post('/items', routeValidator.validate({
  body: {
    name: { isRequired: true },
    date: { isRequired: true, isDate: true },
    type: { isRequired: true, isIn: ['lawn', 'garden', 'tools'] },
    user: { isRequired: true, isEmail: true },
    uuid: { isRequired: false, isUUID: true },
    url: { isURL: true }
  }
}), function (req, res) {
  return res.status(200).end();
});

app.get('/items/:item/messages/:message', routeValidator.validate({
  params: {
    item: { isMongoId: true, isRequired: true },
    message: { isMongoId: true, isRequired: true }
  }
}), function (req, res) {
  return res.status(200).end();
});

app.get('/users', routeValidator.validate({
  query: {
    since: { isDate: true },
    limit: { isInt: true, isRequired: true },
    page: { isInt: true, isRequired: false },
    sort: { isRequired: true }
  },
  callNext: true
}), function (req, res) {
  return res.status(200).end();
});

app.post('/users', routeValidator.validate({
  body: {
    name: { isRequired: true },
    age: { isRequired: true, isValidAge: true },
    email: { isRequired: true, isEmail: true }
  }
}), function (req, res) {
  return res.status(200).end();
});

app.get('/users/:user', routeValidator.validate({
  params: {
    user: { isRequired: true, isEmail: true }
  },
  errorHandler: function (err, req, res) {
    return res.status(400).send({
      message: 'routeErrorHandler',
      error: err.message
    });
  }
}), function (req, res) {
  return res.status(200).end();
});

app.put('/users/:user', routeValidator.validate({
  body: {
    age: { isNumeric: true, isRequired: true }
  }
}), function (req, res) {
  return res.status(200).end();
});

app.post('/turtles', routeValidator.validate({
  body: {
    size: { isRequired: true, isNumeric: true },
    weight: { isRequired: true, isTurtleWeight: true },
    name: { isRequired: true }
  }
}), function (req, res) {
  return res.status(200).end();
});

app.get('/turtles', routeValidator.validate({
  query: {
    sizeStr: { isRequired: false, toLowerCaseSize: true, isIn: ['eight', 'nine', 'ten'] },
    weightRange: { isRequired: false, isWeightRange: true, toRangeArray: true },
    name: { isRequired: false, isLowercase: true, toLowerCase: true },
    slug: { isRequired: false, toLowerCase: true, replaceSpaces: true },
    minDate: { toDate: true }
  }
}), function (req, res) {
  if (req.query.weightRange) {
    // Make sure that it was converted properly
    // '100-500' -> [100, 500]
    var range = req.query.weightRange;
    if (!(range instanceof Array) || range.length !== 2 ||
      typeof range[0] !== 'number' || typeof range[1] !== 'number') {
      return res.status(500).end();
    }
  }

  if (req.query.date && req.query.date !== 'date') {
    return res.status(500).end();
  }

  if (req.query.slug && req.query.slug.indexOf(' ') !== -1) {
    return res.status(500).end();
  }

  return res.status(200).end();
});

app.use( function (err, req, res, next) { // jshint ignore:line
  return res.status(400).send({
    error: err.message,
    message: 'calledNext'
  });
});

app.listen(3000);

module.exports = app;