'use strict';

// node benchmarks/perf_test

var request = require('supertest'),
    async = require('async'),
    fs = require('fs'),
    serverPaths = ['server_no_validation.js', 'server_base.js'],
    results = require('./results.json'),
    app;

var TIMES = 1000,
    LIMIT = 20,
    START = new Date();

var test_routes = [
  function (n, next) {
    request(app)
      .post('/items')
      .send({
        name: 'Chainsaw',
        date: START,
        type: 'tools',
        user: 'stevie@tool.com',
        uuid: 'A987FBC9-4BED-3078-CF07-9141BA07C9F3',
        url: 'http://tool.com/chainsaw/real-big'
      })
      .expect(200, function (err, res) {
        // Write out callback to avoid storing all response objects
        return next(err, +res.headers['x-response-time']);
      });
  },
  function (n, next) {
    request(app)
      .get('/items')
      .query({
        since: START,
        limit: 20,
        page: 1,
        sort: 'date'
      })
      .expect(200, function (err, res) {
        // Write out callback to avoid storing all response objects
        return next(err, +res.headers['x-response-time']);
      });
  },
  function (n, next) {
    request(app)
      .get('/items/507f1f77bcf86cd799439011')
      .expect(200, function (err, res) {
        // Write out callback to avoid storing all response objects
        return next(err, +res.headers['x-response-time']);
      });
  }
];

var tasks = test_routes.map( function (func) {
  return function (callback) {
    async.timesLimit(TIMES, LIMIT, func, callback);
  };
});

results.start_time = START;

async.each(serverPaths, function (serverPath, callback) {
  app = require('./' + serverPath);
  var data = {};

  // Set a timeout to wait for everyone to be ready
  setTimeout( function () {
    async.parallel(tasks, function (err, stats) {
      if (err) throw err;
      var total_time = 0;
      stats.forEach( function (set) {
        set.forEach( function (ms) {
          total_time += ms;
        });
      });
      data.total_requests = TIMES * tasks.length;
      data.total_time = total_time;
      data.ms_per_request = data.total_time / data.total_requests;
      results[serverPath] = data;

      return callback();
    });
  }, 1000);
}, function (err) {
  if (err) throw err;

  fs.writeFile('benchmarks/results.json', JSON.stringify(results, null, 2), function (err) {
    if (err) throw err;
    process.exit(0);
  });
});