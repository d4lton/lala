/**
 * Hemp
 *
 * Copyright ©2017 Dana Basken <dbasken@gmail.com>
 *
 */
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
    if (!this.token) {
        throw new ParseError('Expected ' + type + ': "' + value + '"', null, {type: type, value: value});
    }
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
    if (token.type == 'parenthesis' && token.value == '(') {
      this.eat(token.type, '(');
      var result = this.term();
      this.eat('parenthesis', ')');
      return result;
    } else if (token.type == 'operator' && token.value == '-') {
      this.eat(token.type);
      return {
        type: 'MinusOperator',
        value: this.term(),
        start: token.start,
        end: token.end
      }
    } else if (token.type == 'number') {
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
      if (this.grammar.reserved.indexOf(token.value) !== -1) {
        return this.expression();
      }
      this.eat(token.type);
      var type = 'Variable';
      if (token.value == 'true' || token.value == 'false') {
        type = 'BooleanConstant';
        token.value = (token.value == 'true') ? true : false;
      }
      return {
        type: type,
        value: token.value,
        start: token.start,
        end: token.end
      }
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
      right: this.term(),
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

    if (this.token) {
      if (this.token.type === 'identifier' && this.grammar.reserved.indexOf(this.token.value) !== -1) {
        for (var i = 0; i < this.grammar.expressions.length; i++) {
          if (this.grammar.expressions[i].type === this.token.type && this.grammar.expressions[i].value === this.token.value) {
            var node = {
              type: this.grammar.expressions[i].result,
              start: this.token.start,
              end: this.token.end
            };
            this.eat(this.token.type, this.token.value);
            var rules = this.grammar.expressions[i].rules;
            for (var j = 0; j < rules.length; j++) {
              var rule = rules[j];
              if (rule.optional === true && (!this.token || this.token.type != rule.type || rule.values.indexOf(this.token.value) === -1)) {
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
    }

  };

  block() {
    var node = {
      type: 'Block',
      nodes: []
    };
    while (this.token) {
      if (this.token.type === 'braces' && this.token.value === '}') {
        break;
      }
      node.nodes.push(this.expression());
    }
    return node;
  };

  parse() {
    this.reset();
    return [this.block()];
  };

};

export default Parser;
