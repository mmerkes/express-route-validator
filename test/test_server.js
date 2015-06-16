var express = require('express'),
    bodyParser = require('body-parser'),
    routeValidator = require('../lib/middleware'),
    app = express();

app.use(bodyParser.json())

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
}), function (req, res, next) {
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
}), function (req, res, next) {
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
  errorHandler: function (err, req, res, next) {
    if (err) {
      return res.status(400).send({
        message: 'routeErrorHandler',
        error: err.message
      });
    }
    return res.status(500).send({
      error: 'Don\'t know how we got here...'
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

app.use( function (err, req, res, next) {
  if (err) {
    return res.status(400).send({
      error: err.message,
      message: 'calledNext'
    });
  }
  return res.status(500).send({
    error: 'Don\'t know how we got here...'
  });
});

app.listen(3000);

module.exports = app;