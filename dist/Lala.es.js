function ParseError(message, token, expected) {
  this.message = message;
  this.token = token;
  this.expected = expected;
}
ParseError.prototype = new Error;

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
    }
    return nodes;
  };

  parse() {
    this.reset();
    return this.program();
  };

}

class Lexer {

  constructor(lexicon, text) {
    this.lexicon = lexicon;
    this.text = text;
    this.pos = -1;
  }

  reset() {
    this.pos = -1;
  };

  next() {
    if (!this.end()) {
      this.pos++;
      this.current = this.text[this.pos];
      return this.current;
    }
  };

  peek() {
    return this.text[this.pos + 1];
  };

  end() {
    return (this.pos >= (this.text.length - 1));
  };

  scanstring(lex) {
    var result = ''; // ignore the initial quotation mark
    // TODO: should check for escaped quotation marks
    while ((typeof this.peek() !== 'undefined') && this.peek() !== '"') {
      result += this.next();
    }
    this.next(); // eat the final quotation mark
    return result;
  };

  scan(lex) {
    var result = this.current;
    if (lex.scanner) {
      return this['scan' + lex.scanner](lex);
    }
    if (lex.test) {
      while ((typeof this.peek() !== 'undefined') && lex.test.test(this.peek())) {
        result += this.next();
      }
      if (lex.keepLast === true) {
        result += this.next();
      }
    }
    return result;
  };

  getToken() {
    if (!this.end()) {
      var c = this.next();
      var types = Object.keys(this.lexicon);
      for (var i = 0; i < types.length; i++) {
        var type = types[i];
        if (this.lexicon[type].startTest.test(c)) {
          var start = this.pos;
          var value = this.scan(this.lexicon[type]);
          if (this.lexicon[type].values && this.lexicon[type].values.indexOf(value) === -1) {
            throw new Error(value + ' token matches ' + type + ' regex, but not one of ' + this.lexicon[type].values.join(','));
          }
          return {
            start: start,
            end: this.pos,
            type: type,
            value: value
          }
        }
      }
      throw new Error('could not match: ' + c);
    }
  };

  nextToken() {
    var token = this.getToken();
    while (token && token.type == 'ignore') {
      token = this.getToken();
    }
    return token;
  };

  allTokens() {
    var results = [];
    var token = this.nextToken();
    while (token) {
      results.push(token);
      token = this.nextToken();
    }
    return results;
  };

}

function InterpretError(message, node) {
  this.message = message;
  this.node = node;
}
InterpretError.prototype = new Error;

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

}

class Lala {

  constructor() {

    this.lexicon = {
      ignore: {
        startTest: /[ \t\n;]/,
        test: /[ \t\n;]/
      },
      identifier: {
        startTest: /[a-zA-Z]/,
        test: /[a-zA-Z_]/
      },
      number: {
        startTest: /[0-9\-]/,
        test: /[0-9\.]/
      },
      string : {
        startTest: /["]/,
        scanner: 'string'
      },
      operator: {
        startTest: /[\+\-\*\/><=|&!]/,
        test: /[\+\-\*\/><=|&!]/,
        values: ['=', '+', '-', '*', '/', '==', '!=', '>=', '<=', '<', '>', '||', '&&']
      },
      parenthesis: {
        startTest: /[\(\)]/
      },
      braces: {
        startTest: /[{}]/
      }
    };

    this.grammar = {
      operators: [
        {value: '+', result: 'MathExpression'},
        {value: '-', result: 'MathExpression'},
        {value: '*', result: 'MathExpression'},
        {value: '/', result: 'MathExpression'},
        {value: '==', result: 'ComparisonExpression'},
        {value: '!=', result: 'ComparisonExpression'},
        {value: '<=', result: 'ComparisonExpression'},
        {value: '>=', result: 'ComparisonExpression'},
        {value: '>', result: 'ComparisonExpression'},
        {value: '<', result: 'ComparisonExpression'},
        {value: '||', result: 'LogicalExpression'},
        {value: '&&', result: 'LogicalExpression'},
        {value: '=', result: 'AssignmentExpression'}
      ],
      expressions: [
        {
          result: 'IfStatement',
          rules: [
            {type: 'identifier', value: 'if'},
            {type: 'parenthesis', value: '('},
            {parse: 'term', result: 'test'},
            {type: 'parenthesis', value: ')'},
            {parse: 'expression', result: 'consequence'},
            {type: 'identifier', value: 'else', optional: true},
            {parse: 'expression', result: 'alternate'}
          ]
        },
        {
          result: 'CallStatement',
          rules: [
            {type: 'identifier', values: ['hide', 'show']},
            {type: 'parenthesis', value: '('},
            {type: 'parenthesis', value: ')'}
          ]
        }
      ]
    };

  };

  check(text, variables) {
    var lexer = new Lexer(this.lexicon, text);
    var parser = new Parser(this.grammar, lexer);
    return parser.parse();
  };
  
  run(text, variables, callback) {
    var lexer = new Lexer(this.lexicon, text);
    var parser = new Parser(this.grammar, lexer);
    var interpreter = new Interpreter(parser);
    return {
      returnValue: interpreter.run(variables, callback),
      variables: interpreter.variables
    };
  }

}

Lala.Parser = Parser;
Lala.Lexer = Lexer;
Lala.ParseError = ParseError;
Lala.InterpretError = InterpretError;

export default Lala;
