'use strict';

var request = require('supertest'),
    chai = require('chai'),
    expect = chai.expect,
    routeValidator = require('../lib/index'),
    app = require('./test_server'),
    async = require('async');

describe('INTEGRATION middleware', function () {
  describe('#validates(config)', function () {
    describe('basic route validation', function () {
      it('should send a 400 when route fails validation', function (done) {
        request(app)
          .get('/items/aasdklfjklsadlfjik')
          .expect(400, done);
      });

      it('should send a 200 when route passes validation', function (done) {
        request(app)
          .get('/items/507f1f77bcf86cd799439011')
          .expect(200, done);
      });

      it('should not care if you pass in properties it does not know about', function (done) {
        request(app)
          .get('/items/507f1f77bcf86cd799439011')
          .query({
            foo: 'bar',
            notes: ''
          })
          .expect(200, done);
      });

      it('should ignore properties that you configure that it does not have a method to do' , function (done) {
        // i.e. 'description' is set on the validation config object for documentation purposes,
        // but routeValidator doesn't care and just ignores it
        request(app)
          .get('/items/507f1f77bcf86cd799439011')
          .expect(200, done);
      });
    });

    describe('validates req.params', function () {
      it('should validate params passed into route, on success', function (done) {
        request(app)
          .get('/items/507f1f77bcf86cd799439011')
          .expect(200, done);
      });

      it('should validate params passed into route, on failure', function (done) {
        request(app)
          .get('/items/banana')
          .expect(400, function (err, res) {
            if (err) return done(err);
            expect(res.body).to.have.property('error').that.contains('params.item');
            return done();
          });
      });

      it('should handle multiple params passed into route, on success', function (done) {
        request(app)
          .get('/items/507f1f77bcf86cd799439011/messages/407f1f77bcf86cd799439011')
          .expect(200, done);
      });

      it('should handle multiple params passed into route, on failure', function (done) {
        request(app)
          .get('/items/507f1f77bcf86cd799439011/messages/banana')
          .expect(400, function (err, res) {
            if (err) return done(err);
            expect(res.body).to.have.property('error').that.contains('params.message');
            return done();
          });
      });
    });

    describe('validates req.body', function () {
      it('should validate params passed into body, on success', function (done) {
        request(app)
          .post('/items')
          .send({
            name: 'Chainsaw',
            date: new Date(),
            type: 'tools',
            user: 'stevie@tool.com',
            uuid: 'A987FBC9-4BED-3078-CF07-9141BA07C9F3',
            url: 'http://tool.com/chainsaw/real-big'
          })
          .expect(200, done);
      });

      it('should validate params passed into body, on failure', function (done) {
        request(app)
          .post('/items')
          .send({
            name: 'Chainsaw',
            date: new Date(),
            type: 'tool', // invalid
            user: 'stevie@tool.com',
            uuid: 'A987FBC9-4BED-3078-CF07-9141BA07C9F3',
            url: 'http://tool.com/chainsaw/real-big'
          })
          .expect(400, function (err, res) {
            if (err) return done(err);
            expect(res.body).to.have.property('error').that.contains('body.type');
            return done();
          });
      });

      it('should enforce isRequired', function (done) {
        request(app)
          .post('/items')
          .send({
            name: 'Chainsaw',
            date: new Date(),
            type: 'tools',
            // user: 'stevie@tool.com',
            uuid: 'A987FBC9-4BED-3078-CF07-9141BA07C9F3',
            url: 'http://tool.com/chainsaw/real-big'
          })
          .expect(400, function (err, res) {
            if (err) return done(err);
            expect(res.body).to.have.property('error').that.contains('body.user');
            return done();
          });
      });

      it('should not fail validation when isRequired is set to false and param is not set', function (done) {
        request(app)
          .post('/items')
          .send({
            name: 'Chainsaw',
            date: new Date(),
            type: 'tools',
            user: 'stevie@tool.com',
            // uuid: 'A987FBC9-4BED-3078-CF07-9141BA07C9F3',
            url: 'http://tool.com/chainsaw/real-big'
          })
          .expect(200, done);
      });

      it('should not fail validation when isRequired is not set and param is not set', function (done) {
        request(app)
          .post('/items')
          .send({
            name: 'Chainsaw',
            date: new Date(),
            type: 'tools',
            user: 'stevie@tool.com',
            uuid: 'A987FBC9-4BED-3078-CF07-9141BA07C9F3',
            // url: 'http://tool.com/chainsaw/real-big'
          })
          .expect(200, done);
      });

      it('should validate params if they exist, even if isRequired is set to false', function (done) {
        request(app)
          .post('/items')
          .send({
            name: 'Chainsaw',
            date: new Date(),
            type: 'tools',
            user: 'stevie@tool.com',
            uuid: 'banana', // invalid and not required
            url: 'http://tool.com/chainsaw/real-big'
          })
          .expect(400, function (err, res) {
            if (err) return done(err);
            expect(res.body).to.have.property('error').that.contains('body.uuid');
            return done();
          });
      });
    });

    describe('validates req.query', function () {
      it('should validate query params, on success', function (done) {
        request(app)
          .get('/items')
          .query({
            since: new Date(),
            limit: 20,
            page: 1,
            sort: 'date'
          })
          .expect(200, done);
      });

      it('should validate query params, on failure', function (done) {
        request(app)
          .get('/items')
          .query({
            since: new Date(),
            limit: 'get me all of it', // invalid
            page: 1,
            sort: 'date'
          })
          .expect(400, function (err, res) {
            if (err) return done(err);
            expect(res.body).to.have.property('error').that.contains('query.limit');
            return done();
          });
      });

      it('should enforce isRequired', function (done) {
        request(app)
          .get('/items')
          .query({
            since: new Date(),
            // limit: 20,
            page: 1,
            sort: 'date'
          })
          .expect(400, function (err, res) {
            if (err) return done(err);
            expect(res.body).to.have.property('error').that.contains('query.limit');
            return done();
          });
      });

      it('should not fail validation when isRequired is set to false and param is not set', function (done) {
        request(app)
          .get('/items')
          .query({
            since: new Date(),
            limit: 20,
            // page: 1,
            sort: 'date'
          })
          .expect(200, done);
      });

      it('should not fail validation when isRequired is not set and param is not set', function (done) {
        request(app)
          .get('/items')
          .query({
            // since: new Date(),
            limit: 20,
            page: 1,
            sort: 'date'
          })
          .expect(200, done);
      });

      it('should validate params if they exist, even if isRequired is set to false', function (done) {
        request(app)
          .get('/items')
          .query({
            since: 'yesterday', // invalid
            limit: 20,
            page: 1,
            sort: 'date'
          })
          .expect(400, function (err, res) {
            if (err) return done(err);
            expect(res.body).to.have.property('error').that.contains('query.since');
            return done();
          });
      });
    });

    describe('set callNext in route', function () {
      it('should do nothing different if callNext is set to true and validation passes', function (done) {
        request(app)
          .get('/users')
          .query({
            since: new Date(),
            limit: 20,
            page: 1,
            sort: 'email'
          })
          .expect(200, done);
      });

      it('should call next(err) if validation fails and callNext is set to true', function (done) {
        request(app)
          .get('/users')
          .query({
            since: new Date(),
            limit: 'twenty', // invalid
            page: 1,
            sort: 'email'
          })
          .expect(400, function (err, res) {
            if (err) return done(err);
            expect(res.body).to.have.property('message').that.equals('calledNext');
            expect(res.body).to.have.property('error').that.contains('query.limit');
            return done();
          });
      });
    });

    describe('set errorHandler in route', function () {
      it('should do nothing different if errorHandler is set to true and validation passes', function (done) {
        request(app)
          .get('/users/stevie@tool.com')
          .expect(200, done);
      });

      it('should call errorHandler(err, req, res, next) if validation fails and errorHandler is set to true', function (done) {
        request(app)
          .get('/users/banana')
          .expect(400, function (err, res) {
            if (err) return done(err);
            expect(res.body).to.have.property('message').that.equals('routeErrorHandler');
            expect(res.body).to.have.property('error').that.contains('params.user');
            return done();
          });
      });
    });
  });

  /***********
  NEEDS TO TEST PRECENDENCE OF ERROR HANDLING DECISIONS
  1. config.errorHandler
  2. config.callNext
  3. routeValidator._callNext
  4. routeValidator._errorHandler

  Test Cases
  1. callNext set to false in config, true in app
  ***********/

  describe('#set(key, value)', function () {
    var errorHandler, callNext;

    before( function () {
      errorHandler = routeValidator._errorHandler;
      callNext = routeValidator._callNext;
    });

    after( function () {
      routeValidator._errorHandler = errorHandler;
      routeValidator._callNext = callNext;
    });

    it('should allow setting callNext to pass err into next rather than default behavior', function () {
      routeValidator.set('callNext', true);
      expect(routeValidator).to.have.property('_callNext').that.is.true;
    });

    it('should allow setting the errorHandler to override default behavior', function () {
      var newErrorHandler = function (err, req, res) {
        return res.status(404).send({
          message: 'errorHandled'
        });
      };
      routeValidator.set('errorHandler', newErrorHandler);
      expect(routeValidator).to.have.property('_errorHandler').that.equals(newErrorHandler);
    });

    it('should do nothing if key is not recognized', function () {
      routeValidator.set('invalid', 'banana');
      expect(routeValidator).to.not.have.property('invalid');
    });
  });

  describe('#addValidator(name, fn)', function () {
    var isNumeric;
    before( function () {
      isNumeric = routeValidator._validators.isNumeric;
    });

    after( function () {
      routeValidator._validators.isNumeric = isNumeric;
    });

    it('should not add validator or break if not passed a function', function () {
      routeValidator.addValidator('isNotFunction', 'banana');
      expect(routeValidator._validators).to.not.have.property('isNotFunction');
    });

    it('should allow adding a custom validator', function (done) {
      // Adds new validator
      routeValidator.addValidator('isValidAge', function (str) {
        var age = +str;
        return age ? (age > 0 && age < 120) : false;
      });
      expect(routeValidator._validators).to.have.property('isValidAge');
      async.parallel([
        function (callback) {
          request(app)
            .post('/users')
            .send({
              name: 'Billy',
              age: 23,
              email: 'billy@hillbilly.com'
            })
            .expect(200, callback);
        },
        function (callback) {
          request(app)
            .post('/users')
            .send({
              name: 'Invalid',
              age: 2000,
              email: 'invalid@timeless.com'
            })
            .expect(400, function (err, res) {
              if (err) return callback(err);
              expect(res.body).to.have.property('error').that.contains('body.age');
              return callback();
            });
        }
      ], done);
    });

    it('should override existing validators of the same name', function (done) {
      // Overrides existing validator
      routeValidator.addValidator('isNumeric', function (str) {
        var validNumbers = ['one', 'two', 'three', 'four', 'five', 'six', 'seven'];
        return validNumbers.indexOf(str) !== -1;
      });
      expect(routeValidator._validators).to.have.property('isNumeric');
      async.parallel([
        function (callback) {
          request(app)
            .put('/users/billy')
            .send({
              age: 'seven'
            })
            .expect(200, callback);
        },
        function (callback) {
          request(app)
            .put('/users/invalid')
            .send({
              age: 20
            })
            .expect(400, function (err, res) {
              if (err) return callback(err);
              expect(res.body).to.have.property('error').that.contains('body.age');
              return callback();
            });
        }
      ], done);
    });
  });

  describe('#addValidators(obj)', function () {
    var isNumeric;
    before( function () {
      isNumeric = routeValidator._validators.isNumeric;
    });

    after( function () {
      routeValidator._validators.isNumeric = isNumeric;
    });

    it('should not break if passing in an empty object', function () {
      routeValidator.addValidators({});
    });

    it('should not add validator or break if key is not function', function () {
      routeValidator.addValidators({
        // Adds invalid
        isNotValidator: 'oops'
      });
      expect(routeValidator._validators).to.not.have.property('isNotValidator');
    });

    it('should allow passing in an object of validators and set them internally', function (done) {
      routeValidator.addValidators({
        // Overrides existing
        isNumeric: function (str) {
          var validNumbers = ['eight', 'nine', 'ten'];
          return validNumbers.indexOf(str) !== -1;
        },
        // Adds new
        isTurtleWeight: function (str) {
          var weight = +str;
          return weight ? (weight > 10 && weight < 800) : false;
        }
      });
      expect(routeValidator._validators).to.have.property('isNumeric');
      expect(routeValidator._validators).to.have.property('isTurtleWeight');
      async.parallel([
        function (callback) {
          request(app)
            .post('/turtles')
            .send({
              size: 'nine',
              weight: 500,
              name: 'Stanley'
            })
            .expect(200, callback);
        },
        function (callback) {
          request(app)
            .post('/turtles')
            .send({
              size: 9,
              weight: 600,
              name: 'Loopie'
            })
            .expect(400, function (err, res) {
              if (err) return callback(err);
              expect(res.body).to.have.property('error').that.contains('body.size');
              return callback();
            });
        },
        function (callback) {
          request(app)
            .post('/turtles')
            .send({
              size: 'ten',
              weight: 60000,
              name: 'Loopie'
            })
            .expect(400, function (err, res) {
              if (err) return callback(err);
              expect(res.body).to.have.property('error').that.contains('body.weight');
              return callback();
            });
        }
      ], done);
    });
  });

  describe('addCoercer()', function () {
    describe('config.stage === "before"', function () {
      it('should be able to add a custom coercer run before validation', function (done) {
        routeValidator.addCoercer('toLowerCaseSize', {
          stage: 'before',
          coerce: function (str) {
            return str.toLowerCase();
          }
        });
        expect(routeValidator._before).to.have.property('toLowerCaseSize');
        async.parallel([
          function (callback) {
            request(app)
              .get('/turtles')
              .query({
                sizeStr: 'EIGHT'
              })
              .expect(200, callback);
          },
          function (callback) {
            request(app)
              .get('/turtles')
              .query({
                sizeStr: 'nine'
              })
              .expect(200, callback);
          }
        ], done);
      });

      it('should not add coercer if it is not a function', function () {
        routeValidator.addCoercer('apple', {
          stage: 'before',
          coerce: 'apple'
        });
        expect(routeValidator._before).to.not.have.property('apple');
      });
    });

    describe('config.stage === "after"', function () {
      it('should be able to add a custom coercer run before validation', function (done) {
        routeValidator.addValidator('isWeightRange', function (str) {
          var arr = str.split('-');
          return +arr[0] && +arr[1];
        });
        routeValidator.addCoercer('toRangeArray', {
          stage: 'after',
          coerce: function (str) {
            var arr = str.split('-');
            arr[0] = +arr[0];
            arr[1] = +arr[1];
            return arr;
          }
        });
        expect(routeValidator._after).to.have.property('toRangeArray');
        async.parallel([
          function (callback) {
            request(app)
              .get('/turtles')
              .query({
                weightRange: '500'
              })
              .expect(400, callback);
          },
          function (callback) {
            request(app)
              .get('/turtles')
              .query({
                weightRange: '100-500'
              })
              .expect(200, callback);
          }
        ], done);
      });

      it('should not add coercer if it is not a function', function () {
        routeValidator.addCoercer('peach', {
          stage: 'after',
          coerce: 'peach'
        });
        expect(routeValidator._before).to.not.have.property('peach');
      });
    });

    describe('invalid config.stage', function () {
      it('should do nothing if config.stage is invalid', function () {
        routeValidator.addCoercer('banana', {
          stage: 'banana',
          coerce: function () {
            return 'banana';
          }
        });
        expect(routeValidator._before).to.not.have.property('banana');
      });

      it('should do nothing if config.stage is not set', function () {
        routeValidator.addCoercer('pear', {
          coerce: function () {
            return 'pear';
          }
        });
        expect(routeValidator._before).to.not.have.property('pear');
      });
    });
  });

  describe('#addCoercers(obj)', function () {
    var toDate;
    before( function () {
      toDate = routeValidator._before.toDate;
    });

    after( function () {
      routeValidator._before.toDate = toDate;
    });

    it('should not break if passing in an empty object', function () {
      routeValidator.addCoercers({});
    });

    it('should not add coercer or break if key is not a config object', function () {
      routeValidator.addCoercers({
        // Adds invalid
        isNotCoercer: 'oops',
        alsoNotCoercer: {
          stage: 'notAstage',
          coerce: function () {
            return true;
          }
        },
        andNotOne: {
          stage: 'before',
          coerce: 'funky'
        }
      });
      expect(routeValidator._before).to.not.have.property('isNotCoercer');
      expect(routeValidator._after).to.not.have.property('isNotCoercer');
      expect(routeValidator._before).to.not.have.property('alsoNotCoercer');
      expect(routeValidator._after).to.not.have.property('alsoNotCoercer');
      expect(routeValidator._before).to.not.have.property('addNotOne');
      expect(routeValidator._after).to.not.have.property('addNotOne');
    });

    it('should allow passing in an object of validators and set them internally', function (done) {
      routeValidator.addCoercers({
        // Overrides existing
        toDate: {
          stage: 'after',
          coerce: function () {
            return 'date';
          }
        },
        // Adds new
        toLowerCase: {
          stage: 'before',
          coerce: function (str) {
            return str.toLowerCase();
          }
        },
        replaceSpaces: {
          stage: 'after',
          coerce: function (str) {
            return str.replace(/\s/g, '-');
          }
        }
      });
      expect(routeValidator._after).to.have.property('toDate');
      expect(routeValidator._before).to.have.property('toLowerCase');
      expect(routeValidator._after).to.have.property('replaceSpaces');
      async.parallel([
        function (callback) {
          request(app)
            .get('/turtles')
            .query({
              minDate: new Date()
            })
            .expect(200, callback);
        },
        function (callback) {
          request(app)
            .get('/turtles')
            .query({
              name: 'Mr Turtles'
            })
            .expect(200, callback);
        },
        function (callback) {
          request(app)
            .get('/turtles')
            .query({
              slug: 'My Sweet Turtle'
            })
            .expect(200, callback);
        }
      ], done);
    });
  });
});