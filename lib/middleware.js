'use strict';

var routeValidator = {};

var validators = routeValidator._validators = require('./validators');

var paths = ['params', 'body', 'query'];

routeValidator._errorHandler = function (err, req, res, next) {
  return res.status(400).send({
    error: err.message
  });
};

routeValidator._callNext = false;

routeValidator.set = function (key, value) {
  switch (key) {
    case 'errorHandler':
      routeValidator._errorHandler = value;
      break;
    case 'callNext':
      routeValidator._callNext = value;
      break;
    default:
      console.warn('Attempted to set invalid key: ' + key);
      break;
  }
};

routeValidator.addValidator = function (name, fn) {
  validators[name] = fn;
};

routeValidator.addValidators = function (obj) {
  for (var key in obj) {
    validators[key] = obj[key];
  }
};

var pre = {};
var post = {};

routeValidator.validate = function (config) {
  return function (req, res, next) {
    for (var i = 0, length = paths.length; i < length; i++) {
      var err, path = paths[i];
      if (req[path] && config[path]) {
        err = _validatePath(path);
      }
      if (err) {
        return _handleResult(err);
      }
    }

    return _handleResult(null);

    function _validatePath (path) {
      var conf = config[path],
          scope = req[path],
          tasks = {
            validation: [],
            post: []
          };

      for (var key in conf) {
        var obj = conf[key],
            prop, i, length;

        tasks.validation.length = 0;
        tasks.post.length = 0;

        if (scope[key] === undefined) {
          if (obj.isRequired) {
            return new Error(path + '.' + key + ' failed validation');
          }
          // Otherwise, get out of here
          continue;
        }

        for (prop in obj) {
          if (pre[prop]) {
            scope[key] = pre[prop](scope[key], obj[prop]);
          } else if (validators[prop]) {
            tasks.validation.push(prop);
          } else if (post[prop]) {
            tasks.post.push(prop);
          }
          // Otherwise, just ignore the property
        }

        // Run validators
        for (i = 0, length = tasks.validation.length; i < length; i++) {
          prop = tasks.validation[i];
          if (!validators[prop](scope[key], obj[prop])) {
            return new Error(path + '.' + key + ' failed validation');
          }
        }

        // Run post methods
        for (i = 0, length = tasks.post.length; i < length; i++) {
          prop = tasks.post[i];
          if (!post[prop](scope[key], obj[prop])) {
            return new Error(path + '.' + key + ' failed post');
          }
        }
      }
      return;
    }

    function _handleResult (err) {
      if (err) {
        if (config.errorHandler) {
          return config.errorHandler(err, req, res, next);
        } else if (!config.callNext && (!routeValidator._callNext || config.callNext === false)) {
          return routeValidator._errorHandler(err, req, res, next);
        }
      }

      return next(err);
    }
  };
};

module.exports = routeValidator;