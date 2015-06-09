'use strict';

var routeValidator = {};

var validators = routeValidator._validators = require('./validators');

var paths = ['params', 'body', 'query'];

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
          scope = req[path];

      for (var key in conf) {
        var obj = conf[key];
        if (scope[key] === undefined) {
          if (obj.isRequired) {
            return new Error(path + '.' + key + ' failed validation');
          }
          // Otherwise, get out of here
          continue;
        }

        for (var prop in obj) {
          if (validators[prop] && !validators[prop](scope[key], obj[prop])) {
            return new Error(path + '.' + key + ' failed validation');
          }
        }
      }
      return;
    }

    function _handleResult (err) {
      if (err) {
        return res.status(400).send({
          error: err.message
        });
      }
      return next();
    }
  };
};

module.exports = routeValidator;