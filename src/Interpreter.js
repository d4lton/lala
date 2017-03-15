/**
 * Hemp
 *
 * Copyright ©2017 Dana Basken <dbasken@gmail.com>
 *
 */
import Parser from './Parser.js';
import InterpretError from './InterpretError.js';

class Interpreter {

  constructor(parser) {
    this.parser = parser;
  };

  visitCallStatement(node) {
    if (typeof this.callback === 'function') {
      this.callback(node.value);
    }
  };

  visitBlock(node) {
    var result;
    node.nodes.forEach(function(root) {
      result = this.visit(root);
    }.bind(this));
    return result;
  };

  visitNumericConstant(node) {
    return parseFloat(node.value);
  };

  visitStringConstant(node) {
    return node.value;
  };

  visitVariable(node) {
    if (typeof this.variables[node.value] !== 'undefined') {
      return this.variables[node.value];
    } else {
      throw new InterpretError('Unknown identifier: ' + node.value, node);
    }
  };

  visitMathExpression(node) {
    if (node.operator === '+') {
      return this.visit(node.left) + this.visit(node.right);
    }
    if (node.operator === '-') {
      return this.visit(node.left) - this.visit(node.right);
    }
    if (node.operator === '*') {
      return this.visit(node.left) * this.visit(node.right);
    }
    if (node.operator === '-') {
      return this.visit(node.left) - this.visit(node.right);
    }
    throw new InterpretError('Uknown operator: ' + node.operator, node);
  };

  visitAssignmentExpression(node) {
    var value = this.visit(node.right);
    if (isNaN(value)) {
      return this.variables[node.left.value] = value;
    } else {
      return this.variables[node.left.value] = parseFloat(value);
    }
  };

  visitComparisonExpression(node) {
    if (node.operator === '==') {
      return this.visit(node.left) == this.visit(node.right);
    }
    if (node.operator === '!=') {
      return this.visit(node.left) != this.visit(node.right);
    }
    if (node.operator === '<=') {
      return this.visit(node.left) <= this.visit(node.right);
    }
    if (node.operator === '>=') {
      return this.visit(node.left) >= this.visit(node.right);
    }
    if (node.operator === '<') {
      return this.visit(node.left) < this.visit(node.right);
    }
    if (node.operator === '>') {
      return this.visit(node.left) > this.visit(node.right);
    }
    throw new InterpretError('Uknown operator: ' + node.operator, node);
  }

  visitLogicalExpression(node) {
    if (node.operator === '||') {
      return this.visit(node.left) || this.visit(node.right);
    }
    if (node.operator === '&&') {
      return this.visit(node.left) && this.visit(node.right);
    }
    throw new InterpretError('Uknown operator: ' + node.operator, node);
  };

  visitIfStatement(node) {
    if (this.visit(node.test)) {
      return this.visit(node.consequence);
    } else {
      if (node.alternate) {
        return this.visit(node.alternate);
      }
    }
  };

  visit(node) {
    var method = 'visit' + node.type;
    if (typeof this[method] === 'function') {
      return this[method](node);
    } else {
      throw new Error('visit method "' + method + '" not found');
    }
  };

  run(variables, callback) {

    this.variables = {};
    if (typeof variables == 'object') {
      this.variables = variables;
    }

    this.callback = callback;

    var nodes = this.parser.parse();
    var result;
    nodes.forEach(function(node) {
      result = this.visit(node);
    }.bind(this));
    return result;

  };

};

export default Interpreter;
