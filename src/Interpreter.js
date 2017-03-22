/**
 * Lala
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

  visitUpperStatement(node) {
    var string = '' + this.visit(node.param);
    return string.toUpperCase();
  }

  visitLowerStatement(node) {
    var string = '' + this.visit(node.param);
    return string.toLowerCase();
  }

  strReverse(str) {
    return (str === '') ? '' : this.strReverse(str.substr(1)) + str.charAt(0);
  };

  visitMinusOperator(node) {
    var value = this.visit(node.value);
    if (typeof value === 'string') {
      return this.strReverse(value);
    } else {
    return -1 * value;
    }
  };

  visitBooleanConstant(node) {
    return node.value;
  };

  visitBlock(node) {
    var result;
    node.nodes.forEach(function(root) {
      this.visit(root);
    }.bind(this));
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
        if (typeof object[property] === 'string') {
          object[property] = '' + value;
        } else {
          object[property] = value;
        }
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

  run(variables) {

    this.variables = {};
    if (typeof variables === 'object') {
      this.variables = variables;
    }

    var nodes = this.parser.parse();
    var result;
    nodes.forEach(function(node) {
      this.visit(node);
    }.bind(this));

  };

};

export default Interpreter;
