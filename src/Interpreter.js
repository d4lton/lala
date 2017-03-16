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
  
  visitBooleanConstant(node) {
    return node.value;
  };

  visitNativeFunction(node) {
    switch (node.value) {
      case 'now':
        return Date.now();
        break;
      case 'day':
        var date = new Date();
        return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()];
        break;
      case 'month':
        var date = new Date();
        return ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'Auguest', 'September', 'October', 'November', 'December'][date.getMonth()];
        break;
      case 'year':
        var date = new Date();
        return date.getFullYear()
        break;
      default:
         throw new InterpretError('Unknown native function: ' + node.value, node);
        break;
    };
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
    var properties = node.value.split('.');
    var object = this.variables;
    properties.forEach(function(property) {
      if (typeof object[property] === 'undefined') {
        throw new InterpretError('Unknown identifier: ' + node.value, node);
      }
      object = object[property];
    });
    return object;
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
    if (!isNaN(value) && (typeof value !== 'boolean')) {
      value = parseFloat(value);
    }
    var properties = node.left.value.split('.');
    var object = this.variables;
    properties.forEach(function(property, index) {
      if (index == properties.length - 1) {
        object[property] = value;
      } else {
        if (typeof object[property] === 'undefined') {
          object[property] = {};
        }
        object = object[property];
      }
    });
    return value;
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
