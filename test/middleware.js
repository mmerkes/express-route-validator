'use strict';

var request = require('supertest'),
    express = require('express'),
    chai = require('chai'),
    expect = chai.expect,
    routeValidator = require('../lib/middleware'),
    app = require('./test_server');

describe('INTEGRATION middleware', function () {
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

  // describe('#set(key, value)', function () {
  //   var errorHandler, callNext;
  //   before( function () {
  //     errorHandler = routeValidator._errorHandler;
  //     callNext = routeValidator._callNext;
  //     app.get('/keys/:key', routeValidator.validate({
  //       params: {
  //         key: { isRequired: true, isUUID: true }
  //       }
  //     }), function (req, res) {
  //       return res.status(200).end();
  //     });

  //     app.use( function (err, req, res, next) {
  //       return res.status(500).send({
  //         message: 'calledNext'
  //       });
  //     });
  //   });

  //   afterEach( function () {
  //     routeValidator._callNext = callNext;
  //     routeValidator._errorHandler = errorHandler;
  //   });

  //   it('should allow setting callNext to pass err into next rather than default behavior', function (done) {
  //     routeValidator.set('callNext', true);
  //     request(app)
  //       .get('/keys/not-valid')
  //       .expect(500, function (err, res) {
  //         if (err) return done(err);
  //         expect(res.body).to.have.property('message').that.equals('calledNext');
  //         return done();
  //       });
  //   });

  //   it('should allow setting the errorHandler to override default behavior', function (done) {
  //     routeValidator.set('errorHandler', function (err, req, res, next) {
  //       return res.status(404).send({
  //         message: 'errorHandled'
  //       });
  //     });
  //     request(app)
  //       .get('/keys/not-valid')
  //       .expect(404, function (err, res) {
  //         if (err) return done(err);
  //         expect(res.body).to.have.property('message').that.equals('errorHandled');
  //         return done();
  //       });
  //   });

  //   it('should do nothing if key is not recognized', function (done) {
  //     routeValidator.set('invalid', 'banana');
  //     request(app)
  //       .get('/keys/not-valid')
  //       .expect(400, done);
  //   });
  // });

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

  // describe('addValidator(name, fn)', function () {
  //   it('should allow adding a custom validator', function () {

  //   });

  //   it('should override existing validators of the same name', function () {

  //   });
  // });

  // describe('addValidators(obj)', function () {
  //   it('should not break if passing in an empty object', function () {

  //   });

  //   it('should allow passing in an object of validators and set them internally', function () {

  //   });
  // });

  // describe('addCoercer()', function () {

  // });
});