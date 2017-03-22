/**
 * Lala
 *
 * Copyright ©2017 Dana Basken <dbasken@gmail.com>
 *
 */
function ParseError(message, token, expected) {
  this.message = message;
  this.token = token;
  this.expected = expected;
};
ParseError.prototype = new Error;

export default ParseError;
