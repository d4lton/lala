function ParseError(message, token, expected) {
  this.message = message;
  this.token = token;
  this.expected = expected;
};
ParseError.prototype = new Error;

export default ParseError;
