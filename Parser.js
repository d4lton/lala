class Parser {

  constructor(grammar, lexer) {
    this.grammar = grammar;
    this.lexer = lexer;
    this.token = this.lexer.nextToken();
  };

  reset() {
    this.lexer.reset();
    this.token = this.lexer.nextToken();
  };

  cloneCurrentToken() {
    return JSON.parse(JSON.stringify(this.token));
  };

  eat(type) {
    if (this.token.type == type) {
      this.token = this.lexer.nextToken();
    } else {
      console.trace(type, this.token);
      throw new Error('expected ' + type + ', got ' + this.token.type);
    }
  };

  factor() {
    var token = this.cloneCurrentToken();
    if (token.type == 'number') {
      this.eat(token.type);
      return {
        type: 'NumericConstant',
        value: token.value
      };
    } else if (token.type == 'identifier') {
      this.eat(token.type);
      return {
        type: 'Variable',
        value: token.value
      }
    } else if (token.type == 'parenthesis') {
      this.eat(token.type);
      var result = this.expression();
      this.eat('parenthesis');
      return result;
    } else if (token.type == 'braces' && token.value == '{') {
      this.eat(token.type);
      var result = this.block();
      this.eat('braces');
      return result;
    }
  };

  makeTermNode(type, node) {
    var operator = this.token.value;
    this.eat(this.token.type);
    return {
      type: type,
      left: node,
      operator: operator,
      right: this.factor()
    };
  };

  term() {

    var node = this.factor();

    var foundOperator = false;
    do {
      foundOperator = false;
      for (var i = 0; i < this.grammar.operators.length; i++) {
        while (this.token && this.token.type === 'operator' && this.token.value === this.grammar.operators[i].value) {
          node = this.makeTermNode(this.grammar.operators[i].result, node);
          foundOperator = true;
        }
      }
    } while (foundOperator);

    return node;

  };

  expression() {

    for (var i = 0; i < this.grammar.expressions.length; i++) {
      var rules = grammar.expressions[i].rules;
      if (rules && rules.length > 0) {
        var valueMatch = false;
        if (rules[0].value) {
          valueMatch = (rules[0].value === this.token.value);
        }
        if (rules[0].values) {
          valueMatch = (rules[0].values.indexOf(this.token.value) !== -1);
        }
        if (rules[0].type === this.token.type && valueMatch) {
          var node = {
            type: grammar.expressions[i].result,
            value: this.token.value
          };
          for (var j = 0; j < rules.length; j++) {
            var rule = rules[j];
            if (rule.optional === true && (!this.token || this.token.type != rule.type)) {
              break;
            }
            if (rule.parse) {
              node[rule.result] = this[rule.parse]();
            } else {
              this.eat(rule.type);
            }
          }
          return node;
        }
      }
    }

    return this.term();

  };

  block() {

    var node = {
      type: 'Block',
      nodes: []
    };

    while (this.token && this.token.type !== 'braces' && this.token.value !== '}') {
      node.nodes.push(this.expression());
    }

    return node;
  };

  program() {
    var nodes = [];
    do {
      nodes.push(this.expression());
    } while (this.token);
    return nodes;
  };

  parse() {
    this.reset();
    return this.program();
  };

};
