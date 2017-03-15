/**
 * Hemp
 *
 * Copyright ©2017 Dana Basken <dbasken@gmail.com>
 *
 */
function InterpretError(message, node) {
  this.message = message;
  this.node = node;
};
InterpretError.prototype = new Error;

export default InterpretError;
