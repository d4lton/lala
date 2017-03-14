import ParseError from './ParseError.js';

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

  eat(type, value) {
    if (this.token.type == type && ((typeof value !== 'undefined') ? (this.token.value == value) : true)) {
      this.token = this.lexer.nextToken();
    } else {
      if (typeof value !== 'undefined') {
        throw new ParseError('Expected ' + type + ': "' + value + '"', this.cloneCurrentToken(), {type: type, value: value});
      } else {
        throw new ParseError('Expected ' + type, this.cloneCurrentToken(), {type: type});
      }
    }
  };

  factor() {
    var token = this.cloneCurrentToken();
    if (token.type == 'number') {
      this.eat(token.type);
      return {
        type: 'NumericConstant',
        value: token.value,
        start: token.start,
        end: token.end
      };
    } else if (token.type == "string") {
      this.eat(token.type);
      return {
        type: 'StringConstant',
        value: token.value,
        start: token.start,
        end: token.end
      };
    } else if (token.type == 'identifier') {
      this.eat(token.type);
      return {
        type: 'Variable',
        value: token.value,
        start: token.start,
        end: token.end
      }
    } else if (token.type == 'parenthesis') {
      this.eat(token.type, '(');
      var result = this.expression();
      this.eat('parenthesis', ')');
      return result;
    } else if (token.type == 'braces') {
      this.eat(token.type, '{');
      var result = this.block();
      this.eat('braces', '}');
      return result;
    } else {
      throw new ParseError('Expected an expression', token);
    }
  };

  makeTermNode(type, node) {
    var token = this.cloneCurrentToken();
    this.eat(this.token.type);
    return {
      type: type,
      left: node,
      operator: token.value,
      right: this.factor(),
      start: token.start,
      end: token.end
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
      var rules = this.grammar.expressions[i].rules;
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
            type: this.grammar.expressions[i].result,
            value: this.token.value,
            start: this.token.start,
            end: this.token.end
          };
          for (var j = 0; j < rules.length; j++) {
            var rule = rules[j];
            if (rule.optional === true && (!this.token || this.token.type != rule.type)) {
              break;
            }
            if (rule.parse) {
              node[rule.result] = this[rule.parse]();
            } else {
              this.eat(rule.type, rule.value);
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
    while (this.token) {
      nodes.push(this.expression());
    };
    return nodes;
  };

  parse() {
    this.reset();
    return this.program();
  };

};

export default Parser;
