# express-route-validator

Simple API validation for Express routes.

[![Build Status](https://travis-ci.org/mmerkes/express-route-validator.svg)](https://travis-ci.org/mmerkes/express-route-validator)
[![Coverage Status](https://coveralls.io/repos/mmerkes/express-route-validator/badge.svg?branch=master&service=github)](https://coveralls.io/github/mmerkes/express-route-validator?branch=master)

**NOTE: This module is in progress, so there will be regular updates until it's complete. However, all documented features are live. See [issues](https://github.com/mmerkes/express-route-validator/issues) for upcoming features.**

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

## API Documentation

### Contents

1. [validate()](#validate)
  - [Validation Scope](#validation-scope)
  - [isRequired Property](#isrequired)
  - [Passing in Arguments](#passing-arguments)
  - [Documenting Route Properties](#documenting-routes)
  - [Validation Stages](#validation-stages)
2. [Validators](#validators)
  - [List](#validators-list)
3. [Adding Custom Validators](#custom-validators)
  - [addValidator()](#add-validator)
  - [addValidators()](#add-validators)
4. [Coercers](#coercers)
  - [List](#coercers-list)
5. [Adding Custom Coercers](#custom-coercers)
  - [addCoercer()](#add-coercer)
  - [addCoercers()](#add-coercers)
6. [Configure Error Handling](#configure-error-handling)
  - [callNext](#call-next)
  - [errorHandler](#error-handler)
  - [set()](#set)

### <a name="validate"></a>`validate(config)`

`validate` is the core method in this module. It works by taking a configuration object where you define which scope to look for specific properties and define what you expect those properties to be. It works by returning a closure to serve as middleware for specific routes.

```javascript
app.get('/users/:user', routeValidator.validate({
  params: {
    user: { isRequired: true, isUUID: true }
  }
}), function (req, res) {
  // If it passes validation, this will get called
});
```

By default, if this fails validation, it will send a 400 back to the client with the scope and property as part of the message. However, you can also configure the route (and globally) to call `next(err)` or pass it a custom error handler. More on that later.

#### <a name="validation-scope"></a>Validation Scope

Currently, `express-route-validator` supports validation in `req.params`, `req.body`, and `req.query`; thus, this is a valid configuration object:

```javascript
{
  body: { // checks req.body
    param1: { isRequired: true }
  },
  params: { // checks req.params
    param2: { isRequired: true }
  },
  query: { // checks req.query
    param3: { isRequired: true }
  }
}
```

Or, any combination of these are valid.

#### <a name="isrequired"></a>`isRequired` Property

`validate` supports a special property called `isRequired`. If `isRequired` is set to `true`, validation will fail if the property does not exist in the specified scope. Setting `isRequired` to `false` will not have any impact on the outcome, but it may be useful for documentation purposes.

#### <a name="passing-arguments"></a>Passing in Arguments

Some validation methods require or have optional arguments. For instance, the `isIn` method requires an array of strings to compare the string against.

```javascript
{
  body: {
    param: { isIn: ['arg1', 'arg2', 'arg3'] }
  }
}
```

Some validators take in an options object, such as `isInt`:

```javascript
{
  query: {
    page: { isInt: { min: 1, max: 1000 }}
  }
}
```

See [Validators](#validators) section for complete documentation on validation methods.

#### <a name="documenting-routes"></a>Documenting Route Properties

In `express-route-validator`, unknown methods in your configuration object are ignored, so you can use properties like `notes` or `description` as a way to document properties in your route. For example:

```javascript
{
  params: {
    user: { isRequired: true, isMongoId: true, notes: 'Should be ObjectId of user in the users collection' }
  },
  body: {
    email: { isEmail: true, isLowercase: true, description: 'Secondary email for user. Must not match primary.'}
  }
}
```

#### <a name="validation-stages"></a>Validation Stages

In `validate`, there are three stages: `before`, `validation`, `after`. All validators will run in the `validation` stage. However, you can set coercers to run BEFORE the validators are run or AFTER they are run. For instance, `isDate` doesn't support currently handle Unix time integers, so you can convert it to before the validation runs:

```javascript
// 'fromUnixTime' being a custom before coercer you defined where a integer string is converted to a Date object
{
  body: {
    // '1436385056202' could be converted to a Date object before validation
    ts: { fromUnixTime: true, isDate: true }
  }
}
```

Or, say you do calculations with the date in your controller, and you'd like to accept a `Date` string, but would like to automatically convert it to Unix time before it hits your controller:

```javascript
// 'toUnixTime' being a custom after coercer you defined where a Date string is converted to a Unix time integer
{
  body: {
    // '2000-08-04' could be converted to a Unix time integer
    ts: { isDate: true, toUnixTime: true }
  }
}
```

See [Coercers](#coercers) section for more details on coercers.

### <a name="validators"></a>Validators

`express-route-validator` extends the [validator](https://github.com/chriso/validator.js) module to give you a number of validators by default.

**NOTE:** Parenthesis indicate that an argument is optional. i.e. In `{ isAfter: (Date) }`, the value can be `true`, which will default to now as the date, or a `Date` string.

#### <a name="validators-list"></a>List
* **{ contains: String }** - check if the string contains the seed.
  - `title: { contains: 'foo' }` - pass: 'foobar', fail: 'fizzbuzz'
* **{ equals: String }** - check if the string matches the comparison.
  - `type: { equals: 'valid' }` - pass: 'valid', fail: 'invalid'
* **{ isAfter: (Date) }** - check if the string is a date that's after the specified date (defaults to now).
  - `endDate: { isAfter: true }` - pass: tomorrow as a `Date`, fail: yesterday as a `Date`
  - `startDate: { isAfter: '2010-07-02' }` - pass: '2011-08-03', fail: '2010-07-01'
  - NOTE: Any date format that can be passed into `new Date(date)` successfully will work.
* **{ isAlpha: Boolean }** - check if the string contains only letters (a-zA-Z).
  - `name: { isAlpha: true }` - pass: 'alpha', fail: 'alpha1'
* **{ isAlphanumeric: Boolean }** - check if the string contains only letters and numbers.
  - `username: { isAlphanumeric: true }` - pass: 'airforce1', fail: 'airforced!'
* **{ isAscii: Boolean }** - check if the string contains ASCII chars only.
  - `title: { isAscii: true }` - pass: 'foobar', fail: 'ｆｏｏbar'
* **{ isBase64: Boolean }** - check if a string is base64 encoded.
  - `key: { isBase64: true }` - pass: 'U3VzcGVuZGlzc2UgbGVjdHVzIGxlbw==', fail: '12345'
* **{ isBefore: (Date) }** - check if the string is a date that's before the specified date.
  - `endDate: { isBefore: true }` - pass: yesterday as a `Date`, fail: tomorrow as a `Date`
  - `endDate: { isBefore: '2000-01-01' }` - pass: '1999-1-1', fail: '2000-08-04'
* **{ isBoolean: Boolean }** - check if a string is a boolean.
  - `isPublic: { isBoolean: true }` - pass: 'true', fail: 'banana'
* **{ isByteLength: { min: Number (, max: Number) }}** - check if the string's length (in bytes) falls in a range.
  - `code: { isByteLength: { min: 2 }}` - pass: 'abc', fail: 'a'
  - `code: { isByteLength: { min: 2, max: 3 }}` - pass: 'abc', fail: 'abcd'
* **{ isCreditCard: Boolean }** - check if the string is a credit card.
  - `creditCard: { isCreditCard: true }` - pass: '375556917985515', fail: 'foo'
* **{ isCurrency: (Object) }** - check if the string is a valid currency amount. `Object` is an options object which defaults to `{ symbol: '$', require_symbol: false, allow_space_after_symbol: false, symbol_after_digits: false, allow_negatives: true, parens_for_negatives: false, negative_sign_before_digits: false, negative_sign_after_digits: false, allow_negative_sign_placeholder: false, thousands_separator: ',', decimal_separator: '.', allow_space_after_digits: false }`.
  - `price: { isCurrency: true }` - pass: '$10,123.45', fail: '10,123.45$'
  - `value: { isCurrency: { symbol:'¥', allow_negatives: false }}` - pass: '¥10.03', fail: '$10.03'
* **{ isDate: Boolean }** - check if the string is a date.
  - `startDate: { isDate: true }` - pass: '2011-08-04', fail: '2011-foo-04'
* **{ isDivisbleBy: Number }** - check if the string is a number that's divisible by another.
  - `num: { isDivisibleBy: 2 }` - pass: '2', fail: '3'
* **{ isEmail: (Object) }** - check if the string is an email. `Object` is an options object which defaults to `{ allow_display_name: false, allow_utf8_local_part: true }`. If `allow_display_name` is set to `true`, the validator will also match Display Name <email-address>. If `allow_utf8_local_part` is set to `false`, the validator will not allow any non-English UTF8 character in email address' local part.
  - `email: { isEmail: true }` - pass: 'email@test.com', fail: 'invalid@test'
  - `email: { isEmail: { allow_display_name: true }}` - pass: 'Matt <email@test.com>'
* **{ isFQDN: (Object) }** - check if the string is a fully qualified domain name (e.g. domain.com). `Object` is an options object which defaults to `{ require_tld: true, allow_underscores: false, allow_trailing_dot: false }`.
  - `domain: { isFQDN: true }` - pass: 'domain.com', fail: 'foo'
  - `domain: { isFQDN: { allow_trailing_dot: true }}` - pass: 'example.com.'
* **{ isFloat: (Object) }** - check if the string is a float. `Object` is an options object which can contain the keys `min` and/or `max` to validate the float is within boundaries (e.g. `{ min: 7.22, max: 9.55 }`).
  - `rate: { isFloat: true }` - pass: '1.23', fail: '22a'
  - `percent: { isFloat: { min: 0.0, max: 100.0 }}` - pass: '23.3', fail: '110.0'
* **{ isFullWidth: Boolean }** - check if the string contains any full-width chars.
  - `translation: { isFullWidth: true }` - pass: 'ひらがな・カタカナ、．漢字', fail: 'abc'
* **{ isHalfWidth: Boolean }** - check if the string contains any half-width chars.
  - `chars: { isFullWidth: true }` - pass: '!"#$%&()<>/+=-_? ~^|.,@`{}[]', fail: 'あいうえお'
* **{ isHexColor: Boolean }** - check if the string is a hexadecimal color.
  - `color: { isHexColor: true }` - pass: '#ff0034', fail: '#ff'
* **{ isHexadecimal: Boolean }** - check if the string is a hexadecimal number.
  - `code: { isHexadecimal: true }` - pass: 'deadBEEF', fail: 'abcdefg'
* **{ isIP: (Number) }** - check if the string is an IP (version 4 or 6).
  - `ip: { isIP: true }` - pass: '127.0.0.1', fail: 'abc'
  - `ip6: { isIP: 6 }` - pass: '2001:0db8:0000:0000:0000:ff00:0042:8329', fail: '127.0.0.1'
* **{ isISBN: (Number) }** - check if the string is an ISBN (version 10 or 13).
  - `isbn: { isISBN: true }` - pass: '3836221195', fail: 'not isbn'
  - `isbn: { isISBN: 10 }` - pass: '3836221195', '9780123456472'
* **{ isISIN: Boolean }** - check if the string is an ISIN (stock/security identifier).
  - `isin: { isISIN: true }` - pass: 'AU0000XVGZA3', fail: 'DE000BAY0018'
* **{ isIn: [String] }** - check if the string is in a array of allowed values.
  - `type: { isIn: ['product', 'service'] }` - pass: 'product', fail: 'attribute'
* **{ isInt: (Object) }** - check if the string is an integer. `Object` is an options object which can contain the keys `min` and/or `max` to check the integer is within boundaries (e.g. `{ min: 10, max: 99 }`).
  - `code: { isInt: true }` - pass: '5', fail: 'a'
  - `code: { isInt: { min: 0, max: 100 }}` - pass: '5', fail: '120'
* **{ isJSON: Boolean }** - check if the string is valid JSON (note: uses JSON.parse).
  - `data: { isJSON: true }` - pass: '{ "key": "value" }', fail: 'value'
* **{ isLength: Object }** - check if the string's length falls in a range. `Object` must include property `min`, but `max` is optional. Note: this function takes into account surrogate pairs.
  - `password: { isLength: { min: 8 }}` - pass: 'password', fail: 'pass'
  - `username: { isLength: { min: 8, max: 24 }}` - pass: 'password', fail: 'passwordpasswordpasswordpassword'
* **{ isLowercase: Boolean }** - check if the string is lowercase.
  - `email: { isLowercase: true }` - pass: 'test@email.com', fail: 'TEST@email.com'
* **{ isMobilePhone: String }** - check if the string is a mobile phone number, (the `String`, locale, is one of ['zh-CN', 'en-ZA', 'en-AU', 'en-HK', 'pt-PT', 'fr-FR', 'el-GR', 'en-GB', 'en-US', 'en-ZM']).
  - `mobile: { isMobilePhone: 'en-US' }` - pass: '19876543210', fail: '+10345672645'
* **{ isMongoId: Boolean }** - check if the string is a valid hex-encoded representation of a MongoDB ObjectId.
  - `user: { isMongoId: true }` - pass: '507f1f77bcf86cd799439011', fail: 'invalid'
* **{ isMultibyte: Boolean }** - check if the string contains one or more multibyte chars.
  - `translation: { isMultibyte: true }` - pass: 'ひらがな・カタカナ、．漢字', fail: 'abc'
* **{ isNull: Boolean }** - check if the string is null.
  - `empty: { isNull: true }` - pass: '', fail: 'foo'
* **{ isNumeric: Boolean }** - check if the string contains only numbers.
  - `rate: { isNumeric: true }` - pass: '123', fail: 'abc'
* **{ isSurrogatePair: Boolean }** - check if the string contains any surrogate pairs chars.
  - `surrogate: { isSurrogatePair: true }` - pass: 'ABC千𥧄1-2-3', fail: 'ABC1-2-3'
* **{ isURL: (Object) }** - check if the string is an URL. `Object` is an options object which defaults to `{ protocols: ['http','https','ftp'], require_tld: true, require_protocol: false, allow_underscores: false, host_whitelist: false, host_blacklist: false, allow_trailing_dot: false, allow_protocol_relative_urls: false }`.
  - `url: { isURL: true }` - pass: 'http://www.foobar.com/', fail: 'xyz://foobar.com'
  - `url: { protocols: ['http'] }` - pass: 'http://www.foobar.com/', fail: 'https://www.foobar.com/'
* **{ isUUID: (Number) }** - check if the string is a UUID (version 3, 4 or 5). `Number` is the optional UUID version.
  - `uuid: { isUUID: true }` - pass: 'A987FBC9-4BED-3078-CF07-9141BA07C9F3', fail: 'foo'
  - `uuid4: { isUUID: 4 }` - pass: '713ae7e3-cb32-45f9-adcb-7c4fa86b90c1', fail: 'A987FBC9-4BED-3078-CF07-9141BA07C9F3'
* **{ isUppercase: Boolean }** - check if the string is uppercase.
  - `code: { isUppercase: true }` - pass: 'XWDJ', fail: 'ASDj'
* **{ isVariableWidth: Boolean }** - check if the string contains a mixture of full and half-width chars.
  - `str: { isVariableWidth: true }` - pass: 'ひらがなカタカナ漢字ABCDE', fail: 'abc'
* **{ matches: { pattern: String/RegExp (, modifiers: String) }}** - check if string matches the pattern, which can be a string or regular expression. `modifers` is a string containing regular expression modifiers (i.e. 'i', 'g', etc.)
  - `str: { matches: { pattern: 'foo' }}` - pass: 'foobar', fail: 'FOo'
  - `str: { matches: { pattern: 'foo', modifiers: 'i' }}` - pass: 'FOo', fail: 'bar'
  - `str: { matches: { pattern: /foo/i }}` - pass: 'FOobar', fail: 'bar'
* **{ validate: Function }** - check if `true` is returned when value is passed into the function. `Function` should be `function (str) { // If valid, return true. If invalid, return false. }`
  - `leapYear: { validate: function (str) { var year = +str; return ((year % 4 == 0) && (year % 100 != 0)) || (year % 400 == 0); }}` - pass: '2004', fail: '2002'

Of course, you can use any number of validators in combination:

```javascript
{
  body: {
    birthday: { isRequired: true, isAfter: '1900-1-1', isBefore: '2000-1-1', validate: function (str) { ... }}
  }
}
```

### <a name="custom-validators"></a>Adding Custom Validators

`express-route-validator` provides two methods to add global coercers to your server: `addValidator` and `addValidators`. When set, any route will have access to them. Also, you can set the `validate` property to a custom validator on specific routes (see above for details). Custom validators should return `true` if validation succeeds, and `false` if validation fails.

#### <a name="add-validator"></a>`addValidator(name, fn)`

`addValidator` allows you to ad a validator globally. `name` will be the property you'll use when accessing in the routes, and `fn` should be a function that takes a string (the value of the property) and an optional second argument that will be passed in from the config object.

```javascript
// Will invalidate route if age does not fall within the max and min age
routeValidator.addValidator('isValidAge', function (str, config) {
  var min = 13, max = 120, age = +str;
  if (config) {
    if (config.min) {
      min = config.min;
    }
    if (config.max) {
      max = config.max;
    }
  }
  return age >= min && age <= max;
});
```

```javascript
// Route config object
{
  body: {
    age: { isRequired: true, isValidAge: { min: 5, max: 100 }}
  }
}
// req.body.age = '23' is valid, req.body.age = '4' is invalid
```

#### <a name="add-validators"></a>`addValidators(obj)`

`addValidators` allows you to add multiple validators at the same time by passing an object with the names of the validators as the properties and the validation functions as the values.

```javascript
routeValidator.addValidators({
  // Validates that property is a number between 0-100
  isPercent: function (str) {
    var num = +str;
    return num >= 0 && num <= 100;
  },
  // Validates that property is 'one', 'two', 'three', or 'four' as strings
  is1234: function (str) {
    // You can access validators by use routeValidator._validators and extend
    // them for more specific functionality.
    return routeValidator._validators.isIn(str, ['one', 'two', 'three', 'four']);
  }
});
```

### <a name="coercers"></a>Coercers

`express-route-validator` will extend the [validator](https://github.com/chriso/validator.js) module to give you a number of coercers by default. Essentially, coercers will convert the value in one of the parameters. For example, your server may require that all emails are lowercase characters only, so you could use a coercer called `toLowercase` that automatically converts the email to lowercase before it reaches your controller. Also, coercers could be used to change input from an invalid value to a valid value if a validator is too strict for your purposes. As discussed in the [Validation Stages](#validation-stages) section, there are two coerce stages: before validation and after validation. Be sure that you're coercing at the appropriate stage, which is set when coercers are added.

**NOTE:** Default coercers still needs to be implemented, so they are not currently available. However, you can add custom ones yourself.

#### <a name="coercers-list"></a>List

##### Before Stage Coercers

All of these coercers are run before the validation stage.

* Coming soon!

##### After Stage Coercers

All of these coercers are run after the validation stage.

* Coming soon!

### <a name="custom-coercers"></a>Adding Custom Coercers

`express-route-validator` provides two methods to add global coercers to your server: `addCoercer` and `addCoercers`. When set, any route will have access to them. Also, you will be able to (coming soon!) set a custom coercer on specific routes with the `before` and `after` properties in your route configuration object.

As explained in the [Validation Stages](#validation-stages) section, there are two coerce stages: before and after the validation stage. Keep that in mind when adding custom coercers as running at the wrong stage may cause your validation to fail.

#### <a name="add-coercer"></a>`addCoercer(name, config)`

`addCoercer` allows you to add a coercer globally. `config` is an object that must contain two properties: `stage` which can be 'before' or 'after', which determines if the function is run before or after validation, and `coerce`, which must be a function that takes one mandatory and one optional argument: the value of the property validated and the optional configuration set in the route.

```javascript
// Converts an int to a percent
routeValidator.addCoercer('toPercent', {
  stage: 'after',
  coerce: function (str, config) {
    // config is unused in this case, but can be anything
    return +str / 100;
  }
});
```

```javascript
// Config object passed into a route
{
  body: {
    effort: { isInt: { min: 0, max: 100 }, toPercent: true }
  }
}
// req.body.effort = '75' becomes req.body.effort = 0.75 AFTER isInt validates it
```

#### <a name="add-coercers"></a>`addCoercers(obj)`

`addCoercers` allows you to add multiple coercers at the same time by passing an object with the names of the coercers as properties and the config objects as values.

```javascript
routeValidators.addCoercers({
  // Converts Unix timestamp string to Date object BEFORE validation
  fromUnixTime: {
    stage: 'before',
    coerce: function (str, config) {
      var ts = +str;
      // config.only should be set to true if str MUST be a Unix timestamp,
      // versus allowing other date strings and only converting if Unix ts
      if (config.only) {
        return ts;
      }
      // +'2000-01-01' would be NaN, so we'll check for that
      return ts ? ts : new Date(str);
    }
  },
  // Converts date strings to Unix timestamp integers AFTER validation
  toUnixTime: {
    stage: 'after',
    coerce: function (str) {
      return new Date(str).valueOf();
    }
  }
});
```

### <a name="configure-error-handling"></a>Configure Error Handling

By default, `express-route-handler` will send a 400 status code and a body with property `error` that contains the scope and the key that were invalid.

```javascript
// reponse body if body.email failed validation
{
  error: 'body.email failed validation'
}
```

However, you can also configure error handling on a global level or route specific level.

#### <a name="call-next"></a>`callNext`

If `callNext` is set to `true` for a given route or globally (see [set()](#set)), rather than sending a 400 on invalid, an error will be passed into `next()` so that it can be handled by your middleware.

```javascript
{
  body: {
    param1: { ... }
  },
  callNext: true // calls next(err) on invalid
}
```

#### <a name="error-handler"></a>`errorHandler`

If `errorHandler` is set to a function in the route or globally (see [set()](#set)), rather than sending a 400 on invalid, an error (as well as `req`, `res`, and `next`) will be passed into the defined function.

```javascript
{
  body: {
    param: { ... }
  },
  errorHandler: function (err, req, res, next) {
    // Do some custom handling
  }
}
```

#### <a name="set"></a>`set(key, value)`

`set` allows you to set `callNext` and an `errorHandler` globally.

```javascript
// Changes default behavior to always call next with route fails validation
routeValidator.set('callNext', true);
```

```javascript
routeValidator.set('errorHandler', function (err, req, res, next) {
  // Do some custom handling
});
```

However, route specific settings will always override global settings.

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