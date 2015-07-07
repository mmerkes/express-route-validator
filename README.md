# express-route-validator

Simple API validation for Express routes.

[![Build Status](https://travis-ci.org/mmerkes/express-route-validator.svg)](https://travis-ci.org/mmerkes/express-route-validator)

**NOTE: This library is not complete, so use with caution. However, it should function as is. See [issues](https://github.com/mmerkes/express-route-validator/issues) for upcoming features.**

## Basic Usage

`express-route-validator` has very simple usage. Just call `routeValidator.validate()` as middleware in your `express` routes, pass it a configuration object, and it returns a closure that validates based on your configuration object and sends a 400 by default if it fails. Also, `express-route-validator` extends the `validator` library to give you access to its methods for validation.

Here's a very basic server:

```javascript
var express = require('express'),
    bodyParser = require('body-parser'),
    routeValidator = require('express-route-validator'),
    app = express();

app.use(bodyParser.json());

var supportedTags = ['javascript', 'node', 'express', 'http'];

app.post('/articles', routeValidator.validate({
  body: {
    // Sends a 400 if req.body.title is undefined or contains non-ASCII characters
    title: { isRequired: true, isAscii: true },
    // Sends a 400 if req.body.content is undefined
    content: { isRequired: true },
    // Sends a 400 if req.body.tag IS defined and does not match
    // an element in the supportedTags array. Ignores if undefined.
    tag: { isIn: supportedTags }
  }
}), function (req, res) {
  // Validation passed, so save the article
});

app.get('/articles/:article', routeValidator.validate({
  params: {
    // Send a 400 if req.params.article is undefined or not an MongoId
    article: { isRequired: true, isMongoId: true }
  },
  query: {
    // Sends a 400 if req.query.includeAuthor IS defined
    // and is not a boolean. Ignores if undefined.
    includeAuthor: { isRequired: false, isBoolean: true }
  }
}), function (req, res) {
  // Validation passed, so return the article
});

app.listen(3000);
```

[See test server for more complete usage.](https://github.com/mmerkes/express-route-validator/blob/master/test/test_server.js)

## API Documentation

Coming soon!

## Acknowledgements

Syntax is inspired by the [node-restify-validation](https://www.npmjs.com/package/node-restify-validation) library.

## Contributing

Contributions are always welcome! If you find bugs, open an issue on the [github repo](https://github.com/mmerkes/express-route-validator/issues). Extra points for a pull request fixing the bug! All bug fixes must include testing to get the PR accepted. Please follow the style conventions in the code. If you have ideas for enhancements, make sure an issue is not already created and if not, open an [issue](https://github.com/mmerkes/express-route-validator/issues) to put it up for discussion.

## License

The MIT License (MIT)

Copyright (c) 2015 Matt Merkes

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.