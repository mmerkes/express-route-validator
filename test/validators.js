'use strict';

var validators = require('../lib/validators'),
    chai = require('chai'),
    expect = chai.expect;

/*
  NOTE: These tests are not meant to test the validator library.
  They are meant to affirm that the wrapping was done successfully,
  affirm that passing in `true` as the second argument in cases where
  a second argument is not required and won't break the check,
  and to test that arrays of arguments are handled properly when validator
  requires/allows more than two arguments.
*/

describe('UNIT Validators', function () {
  describe('contains(str, seed)', function () {

  });

  describe('equals(str, comparison)', function () {

  });

  describe('isAfter(str [, date])', function () {

  });

  describe('isAlpha(str)', function () {

  });

  describe('isAlphanumeric(str)', function () {

  });

  describe('isAsii(str)', function () {

  });

  describe('isBase64(str)', function () {

  });

  describe('isBefore(str [, date])', function () {

  });

  describe('isBoolean(str)', function () {

  });

  describe('isByteLength(str, args)', function () {

  });

  describe('isCreditCard(str)', function () {

  });

  describe('isCurrency(str [,options])', function () {

  });

  describe('isDate(str)', function () {

  });

  describe('isDivisibleBy(str, number)', function () {

  });

  describe('isEmail(str [,options])', function () {

  });

  describe('isFQDN(str [,options])', function () {

  });

  describe('isFloat(str [,options])', function () {

  });

  describe('isFullWidth(str)', function () {

  });

  describe('isHalfWidth(str)', function () {

  });

  describe('isHexColor(str)', function () {

  });
  
  describe('isHexadecimal(str)', function () {

  });
  
  describe('isIP(str [, version])', function () {

  });
  
  describe('isISBN(str [,version])', function () {

  });
  
  describe('isISIN(str)', function () {

  });
  
  describe('isIn(str, values)', function () {

  });
  
  describe('isInt(str [, options])', function () {

  });
  
  describe('isJSON(str)', function () {

  });
  
  describe('isLength(str, args)', function () {

  });
  
  describe('isLowercase(str)', function () {

  });
  
  describe('isMobilePhone(str, locale)', function () {

  });
  
  describe('isMongoId(str)', function () {

  });
  
  describe('isMultibyte(str)', function () {

  });
  
  describe('isNull(str)', function () {

  });
  
  describe('isNumeric(str)', function () {

  });
  
  describe('isSurrogatePair(str)', function () {

  });
  
  describe('isURL(str [, options])', function () {

  });
  
  describe('isUUID(str [, version])', function () {

  });
  
  describe('isUppercase(str)', function () {

  });
  
  describe('isVariableWidth(str)', function () {

  });
  
  describe('matches(str, args)', function () {

  });
});