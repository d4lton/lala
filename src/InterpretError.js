function InterpretError(message, node) {
  this.message = message;
  this.node = node;
};
InterpretError.prototype = new Error;

export default InterpretError;
