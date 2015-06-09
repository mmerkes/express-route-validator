'use strict';

var request = require('supertest'),
    express = require('express'),
    chai = require('chai'),
    expect = chai.expect,
    middleware = require('../lib/middleware');

describe('INTEGRATION middleware', function () {
  var app = express();

  before( function (done) {
    app.listen(3000, done);
  });

  describe('basic route validation', function () {
    before( function () {
      app.get('/items/:item', middleware.validate({
        params: {
          item: { isMongoId: true, isRequired: true }
        }
      }), function (req, res, next) {
        return res.status(200).end();
      });
    });

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
});