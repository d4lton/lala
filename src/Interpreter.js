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

  visitVariable(node) {
    return this.variables[node.value];
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
  };

  visitAssignmentExpression(node) {
    var value = this.visit(node.right);
    if (isNaN(value)) {
      this.variables[node.left.value] = value;
    } else {
      this.variables[node.left.value] = parseFloat(value);
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
  }

  visitLogicalExpression(node) {
    if (node.operator === '||') {
      return this.visit(node.left) || this.visit(node.right);
    }
    if (node.operator === '&&') {
      return this.visit(node.left) && this.visit(node.right);
    }
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
    nodes.forEach(function(node) {
      this.visit(node);
    }.bind(this));

  };

};

export default Interpreter;
