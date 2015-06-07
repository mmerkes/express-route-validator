var express = require('express'),
    app = express(),
    routeValidator = require('../index.js'),
    validator = require('validator');

// Set custom error handling
// routeValidator.set('errorHandler', function (err, req, res, next) {
//   console.error(err, 'Validation failed for route ' + req.path);
//   return res.render('error', {
//     message: err.message
//   });
// });

// Configure to pass error into next, defaults to false
// routeValidator.set('callNext', true);

// Add custom validators
routeValidator.addValidator('isPercent', function (val) {
  var num = validator.toFloat(val);
  if (!num || num < 0 || num > 1) {
    return false;
  }
  return true;
});

// Add custom coercer
routeValidator.addCoercer('dollarsToFloat', function (val) {
  return +val.replace(/[^0-9\.]+/g, '');
});

app.get('/', function (req, res) {
  res.send('Hello World!');
});

app.get('/items', routeValidator.validate({
  query: {
    since: { isDate: true, isRequired: true, toDate: true },
    minPrice: { isFloat: true, toFloat: true }, // isRequired defaults to false
    maxPrice: { isFloat: true, toFloat: true }
  },
  // Set custom error handler
  errorHandler: function (err, req, res, next) {
    return res.render('error', {
      message: err.message
    });
  }
}), function (req, res) {
  return res.status(200).json({
    items: [{
      title: 'Chainsaw',
      description: 'Cutting machine',
      price: '$199.99'
    }, {
      title: 'Lawnmower',
      description: 'Push lawnmower',
      price: '$149.99'
    }]
  });
});

app.post('/items', routeValidator.validate({
  body: {
    title: { isRequired: true },
    description: { isRequired: true },
    price: { isRequired: true, isCurrency: true }
  },
  // Rather than sending a 400, tell validator to call next(err); instead
  // so that it can be handled in the pipeline
  callNext: true
}), function (req, res) {
  return res.status(201).json({
    id: '507f1f77bcf86cd799439011',
    title: req.body.title,
    description: req.body.description,
    price: req.body.price
  });
});

app.get('/items/:item', routeValidator.validate({
  params: {
    item: { isRequired: true, isMongoId: true }
  }
}), function (req, res) {
  return res.status(200).json({
    title: 'Chainsaw',
    description: 'Cutting machine',
    price: '$199.99'
  });
});

app.put('/items/:item', routeValidator.validate({
  params: {
    item: { isRequired: true, isMongoId: true }
  },
  body: {
    // Use a custom defined coercer
    price: { isCurrency: true, dollarsToFloat: true },
    // Pass in an argument to validator
    department: { isIn: ['lawn', 'hardware', 'tools'] },
    promoCode: {
      // Pass in custom validate function 
      validate: function (code) {
        return validator.isAlphanumeric(code) && code.length === 5;
      },
      // Pass in custom coerce function
      coerce: function (code) {
        return code.toUpperCase();
      }
    },
    // Use a custom defined validator
    discount: { isPercent: true, toFloat: true }
  }
}), function (req, res) {
  return res.status(204).end();
});

app.get('/users/:email', routeValidator.validate({
  params: {
    username: { isRequired: true, isEmail: true, normalizeEmail: true, trim: true }
  }
}), function (req, res) {
  return res.status(200).json({
    name: 'Tommy P.',
    email: req.params.email
  });
});

var server = app.listen(3000, function () {
  console.log('Example app listening at http://locahost:3000');
});