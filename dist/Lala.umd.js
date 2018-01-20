(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global.Lala = factory());
}(this, (function () { 'use strict';

/**
 * Lala
 *
 * Copyright ©2017 Dana Basken <dbasken@gmail.com>
 *
 */
function ParseError(message, token, expected) {
  this.message = message;
  this.token = token;
  this.expected = expected;
}
ParseError.prototype = new Error();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
};











var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();







var get = function get(object, property, receiver) {
  if (object === null) object = Function.prototype;
  var desc = Object.getOwnPropertyDescriptor(object, property);

  if (desc === undefined) {
    var parent = Object.getPrototypeOf(object);

    if (parent === null) {
      return undefined;
    } else {
      return get(parent, property, receiver);
    }
  } else if ("value" in desc) {
    return desc.value;
  } else {
    var getter = desc.get;

    if (getter === undefined) {
      return undefined;
    }

    return getter.call(receiver);
  }
};

















var set = function set(object, property, value, receiver) {
  var desc = Object.getOwnPropertyDescriptor(object, property);

  if (desc === undefined) {
    var parent = Object.getPrototypeOf(object);

    if (parent !== null) {
      set(parent, property, value, receiver);
    }
  } else if ("value" in desc && desc.writable) {
    desc.value = value;
  } else {
    var setter = desc.set;

    if (setter !== undefined) {
      setter.call(receiver, value);
    }
  }

  return value;
};

/**
 * Lala
 *
 * Copyright ©2017 Dana Basken <dbasken@gmail.com>
 *
 */
var Parser = function () {
  function Parser(grammar, lexer) {
    classCallCheck(this, Parser);

    this.grammar = grammar;
    this.lexer = lexer;
    this.token = this.lexer.nextToken();
  }

  createClass(Parser, [{
    key: 'reset',
    value: function reset() {
      this.lexer.reset();
      this.token = this.lexer.nextToken();
    }
  }, {
    key: 'cloneCurrentToken',
    value: function cloneCurrentToken() {
      return JSON.parse(JSON.stringify(this.token));
    }
  }, {
    key: 'eat',
    value: function eat(type, value) {
      if (!this.token) {
        throw new ParseError('Expected ' + type + ': "' + value + '"', null, { type: type, value: value });
      }
      if (this.token.type == type && (typeof value !== 'undefined' ? this.token.value == value : true)) {
        this.token = this.lexer.nextToken();
      } else {
        if (typeof value !== 'undefined') {
          throw new ParseError('Expected ' + type + ': "' + value + '"', this.cloneCurrentToken(), { type: type, value: value });
        } else {
          throw new ParseError('Expected ' + type, this.cloneCurrentToken(), { type: type });
        }
      }
    }
  }, {
    key: 'factor',
    value: function factor() {
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
        };
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
          token.value = token.value == 'true' ? true : false;
        }
        return {
          type: type,
          value: token.value,
          start: token.start,
          end: token.end
        };
      } else if (token.type == 'braces') {
        this.eat(token.type, '{');
        var result = this.block();
        this.eat('braces', '}');
        return result;
      } else {
        throw new ParseError('Expected an expression', token);
      }
    }
  }, {
    key: 'makeTermNode',
    value: function makeTermNode(type, node) {
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
    }
  }, {
    key: 'term',
    value: function term() {

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
    }
  }, {
    key: 'expression',
    value: function expression() {

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
    }
  }, {
    key: 'block',
    value: function block() {
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
    }
  }, {
    key: 'parse',
    value: function parse() {
      this.reset();
      return [this.block()];
    }
  }]);
  return Parser;
}();

/**
 * Lala
 *
 * Copyright ©2017 Dana Basken <dbasken@gmail.com>
 *
 */
var Lexer = function () {
  function Lexer(lexicon, text) {
    classCallCheck(this, Lexer);

    this.lexicon = lexicon;
    this.text = text;
    this.pos = -1;
  }

  createClass(Lexer, [{
    key: 'reset',
    value: function reset() {
      this.pos = -1;
    }
  }, {
    key: 'next',
    value: function next() {
      if (!this.end()) {
        this.pos++;
        this.current = this.text[this.pos];
        return this.current;
      }
    }
  }, {
    key: 'peek',
    value: function peek() {
      return this.text[this.pos + 1];
    }
  }, {
    key: 'end',
    value: function end() {
      return this.pos >= this.text.length - 1;
    }
  }, {
    key: 'scanstring',
    value: function scanstring(lex) {
      var result = ''; // ignore the initial quotation mark
      // TODO: should check for escaped quotation marks
      while (typeof this.peek() !== 'undefined' && this.peek() !== '"') {
        result += this.next();
      }
      this.next(); // eat the final quotation mark
      return result;
    }
  }, {
    key: 'scan',
    value: function scan(lex) {
      var result = this.current;
      if (lex.scanner) {
        return this['scan' + lex.scanner](lex);
      }
      if (lex.test) {
        while (typeof this.peek() !== 'undefined' && lex.test.test(this.peek())) {
          result += this.next();
        }
        if (lex.keepLast === true) {
          result += this.next();
        }
      }
      return result;
    }
  }, {
    key: 'getToken',
    value: function getToken() {
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
            };
          }
        }
        throw new Error('could not match: ' + c);
      }
    }
  }, {
    key: 'nextToken',
    value: function nextToken() {
      var token = this.getToken();
      while (token && token.type == 'ignore') {
        token = this.getToken();
      }
      return token;
    }
  }, {
    key: 'allTokens',
    value: function allTokens() {
      var results = [];
      var token = this.nextToken();
      while (token) {
        results.push(token);
        token = this.nextToken();
      }
      return results;
    }
  }]);
  return Lexer;
}();

/**
 * Lala
 *
 * Copyright ©2017 Dana Basken <dbasken@gmail.com>
 *
 */
function InterpretError(message, node) {
  this.message = message;
  this.node = node;
}
InterpretError.prototype = new Error();

/**
 * Formatter, repackaged from http://locutus.io/php/sprintf under MIT license
 */
var Formatter = function () {
  function Formatter() {
    classCallCheck(this, Formatter);
  }

  createClass(Formatter, null, [{
    key: 'sprintf',
    value: function sprintf() {

      var regex = /%%|%(\d+\$)?([-+'#0 ]*)(\*\d+\$|\*|\d+)?(?:\.(\*\d+\$|\*|\d+))?([scboxXuideEfFgG])/g;
      var a = arguments;
      var i = 0;
      var format = a[i++];

      var _pad = function _pad(str, len, chr, leftJustify) {
        if (!chr) {
          chr = ' ';
        }
        var padding = str.length >= len ? '' : new Array(1 + len - str.length >>> 0).join(chr);
        return leftJustify ? str + padding : padding + str;
      };

      var justify = function justify(value, prefix, leftJustify, minWidth, zeroPad, customPadChar) {
        var diff = minWidth - value.length;
        if (diff > 0) {
          if (leftJustify || !zeroPad) {
            value = _pad(value, minWidth, customPadChar, leftJustify);
          } else {
            value = [value.slice(0, prefix.length), _pad('', diff, '0', true), value.slice(prefix.length)].join('');
          }
        }
        return value;
      };

      var _formatBaseX = function _formatBaseX(value, base, prefix, leftJustify, minWidth, precision, zeroPad) {
        // Note: casts negative numbers to positive ones
        var number = value >>> 0;
        prefix = prefix && number && {
          '2': '0b',
          '8': '0',
          '16': '0x'
        }[base] || '';
        value = prefix + _pad(number.toString(base), precision || 0, '0', false);
        return justify(value, prefix, leftJustify, minWidth, zeroPad);
      };

      // _formatString()
      var _formatString = function _formatString(value, leftJustify, minWidth, precision, zeroPad, customPadChar) {
        if (precision !== null && precision !== undefined) {
          value = value.slice(0, precision);
        }
        return justify(value, '', leftJustify, minWidth, zeroPad, customPadChar);
      };

      // doFormat()
      var doFormat = function doFormat(substring, valueIndex, flags, minWidth, precision, type) {
        var number, prefix, method, textTransform, value;

        if (substring === '%%') {
          return '%';
        }

        // parse flags
        var leftJustify = false;
        var positivePrefix = '';
        var zeroPad = false;
        var prefixBaseX = false;
        var customPadChar = ' ';
        var flagsl = flags.length;
        var j;
        for (j = 0; j < flagsl; j++) {
          switch (flags.charAt(j)) {
            case ' ':
              positivePrefix = ' ';
              break;
            case '+':
              positivePrefix = '+';
              break;
            case '-':
              leftJustify = true;
              break;
            case "'":
              customPadChar = flags.charAt(j + 1);
              break;
            case '0':
              zeroPad = true;
              customPadChar = '0';
              break;
            case '#':
              prefixBaseX = true;
              break;
          }
        }

        // parameters may be null, undefined, empty-string or real valued
        // we want to ignore null, undefined and empty-string values
        if (!minWidth) {
          minWidth = 0;
        } else if (minWidth === '*') {
          minWidth = +a[i++];
        } else if (minWidth.charAt(0) === '*') {
          minWidth = +a[minWidth.slice(1, -1)];
        } else {
          minWidth = +minWidth;
        }

        // Note: undocumented perl feature:
        if (minWidth < 0) {
          minWidth = -minWidth;
          leftJustify = true;
        }

        if (!isFinite(minWidth)) {
          throw new Error('sprintf: (minimum-)width must be finite');
        }

        if (!precision) {
          precision = 'fFeE'.indexOf(type) > -1 ? 6 : type === 'd' ? 0 : undefined;
        } else if (precision === '*') {
          precision = +a[i++];
        } else if (precision.charAt(0) === '*') {
          precision = +a[precision.slice(1, -1)];
        } else {
          precision = +precision;
        }

        // grab value using valueIndex if required?
        value = valueIndex ? a[valueIndex.slice(0, -1)] : a[i++];

        switch (type) {
          case 's':
            return _formatString(value + '', leftJustify, minWidth, precision, zeroPad, customPadChar);
          case 'c':
            return _formatString(String.fromCharCode(+value), leftJustify, minWidth, precision, zeroPad);
          case 'b':
            return _formatBaseX(value, 2, prefixBaseX, leftJustify, minWidth, precision, zeroPad);
          case 'o':
            return _formatBaseX(value, 8, prefixBaseX, leftJustify, minWidth, precision, zeroPad);
          case 'x':
            return _formatBaseX(value, 16, prefixBaseX, leftJustify, minWidth, precision, zeroPad);
          case 'X':
            return _formatBaseX(value, 16, prefixBaseX, leftJustify, minWidth, precision, zeroPad).toUpperCase();
          case 'u':
            return _formatBaseX(value, 10, prefixBaseX, leftJustify, minWidth, precision, zeroPad);
          case 'i':
          case 'd':
            number = +value || 0;
            // Plain Math.round doesn't just truncate
            number = Math.round(number - number % 1);
            prefix = number < 0 ? '-' : positivePrefix;
            value = prefix + _pad(String(Math.abs(number)), precision, '0', false);
            return justify(value, prefix, leftJustify, minWidth, zeroPad);
          case 'e':
          case 'E':
          case 'f': // @todo: Should handle locales (as per setlocale)
          case 'F':
          case 'g':
          case 'G':
            number = +value;
            prefix = number < 0 ? '-' : positivePrefix;
            method = ['toExponential', 'toFixed', 'toPrecision']['efg'.indexOf(type.toLowerCase())];
            textTransform = ['toString', 'toUpperCase']['eEfFgG'.indexOf(type) % 2];
            value = prefix + Math.abs(number)[method](precision);
            return justify(value, prefix, leftJustify, minWidth, zeroPad)[textTransform]();
          default:
            return substring;
        }
      };

      return format.replace(regex, doFormat);
    }
  }]);
  return Formatter;
}();

/**
 * Lala
 *
 * Copyright ©2017 Dana Basken <dbasken@gmail.com>
 *
 */
var Interpreter = function () {
  function Interpreter(parser) {
    classCallCheck(this, Interpreter);

    this.parser = parser;
  }

  createClass(Interpreter, [{
    key: 'visitFormatStatement',
    value: function visitFormatStatement(node) {
      var format = this.visit(node.format);
      var params = [this.visit(node.param)];
      return Formatter.sprintf(format, params);
    }
  }, {
    key: 'visitUpperStatement',
    value: function visitUpperStatement(node) {
      var string = '' + this.visit(node.param);
      return string.toUpperCase();
    }
  }, {
    key: 'visitLowerStatement',
    value: function visitLowerStatement(node) {
      var string = '' + this.visit(node.param);
      return string.toLowerCase();
    }
  }, {
    key: 'strReverse',
    value: function strReverse(str) {
      return str === '' ? '' : this.strReverse(str.substr(1)) + str.charAt(0);
    }
  }, {
    key: 'visitMinusOperator',
    value: function visitMinusOperator(node) {
      var value = this.visit(node.value);
      if (typeof value === 'string') {
        return this.strReverse(value);
      } else {
        return -1 * value;
      }
    }
  }, {
    key: 'visitBooleanConstant',
    value: function visitBooleanConstant(node) {
      return node.value;
    }
  }, {
    key: 'visitBlock',
    value: function visitBlock(node) {
      var result;
      node.nodes.forEach(function (root) {
        this.visit(root);
      }.bind(this));
    }
  }, {
    key: 'visitNumericConstant',
    value: function visitNumericConstant(node) {
      return parseFloat(node.value);
    }
  }, {
    key: 'visitStringConstant',
    value: function visitStringConstant(node) {
      return node.value;
    }
  }, {
    key: 'visitVariable',
    value: function visitVariable(node) {
      var properties = node.value.split('.');
      var object = this.variables;
      for (var i = 0; i < properties.length; i++) {
        if (typeof object[properties[i]] === 'undefined') {
          object = null;
          break;
        } else {
          object = object[properties[i]];
        }
      }
      return object;
    }
  }, {
    key: 'visitMathExpression',
    value: function visitMathExpression(node) {
      if (node.operator === '+') {
        return this.visit(node.left) + this.visit(node.right);
      }
      if (node.operator === '-') {
        return this.visit(node.left) - this.visit(node.right);
      }
      if (node.operator === '*') {
        return this.visit(node.left) * this.visit(node.right);
      }
      if (node.operator === '/') {
        return this.visit(node.left) / this.visit(node.right);
      }
      throw new InterpretError('Uknown operator: ' + node.operator, node);
    }
  }, {
    key: 'visitAssignmentExpression',
    value: function visitAssignmentExpression(node) {
      var value = this.visit(node.right);
      /*
      if (!isNaN(value) && (typeof value !== 'boolean')) {
        value = parseFloat(value);
      }
      */
      var properties = node.left.value.split('.');
      var object = this.variables;
      properties.forEach(function (property, index) {
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
    }
  }, {
    key: 'visitComparisonExpression',
    value: function visitComparisonExpression(node) {
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
  }, {
    key: 'visitLogicalExpression',
    value: function visitLogicalExpression(node) {
      if (node.operator === '||') {
        return this.visit(node.left) || this.visit(node.right);
      }
      if (node.operator === '&&') {
        return this.visit(node.left) && this.visit(node.right);
      }
      throw new InterpretError('Uknown operator: ' + node.operator, node);
    }
  }, {
    key: 'visitIfStatement',
    value: function visitIfStatement(node) {
      if (this.visit(node.test)) {
        return this.visit(node.consequence);
      } else {
        if (node.alternate) {
          return this.visit(node.alternate);
        }
      }
    }
  }, {
    key: 'visit',
    value: function visit(node) {
      var method = 'visit' + node.type;
      if (typeof this[method] === 'function') {
        return this[method](node);
      } else {
        throw new Error('visit method "' + method + '" not found');
      }
    }
  }, {
    key: 'run',
    value: function run(variables) {

      this.variables = {};
      if ((typeof variables === 'undefined' ? 'undefined' : _typeof(variables)) === 'object') {
        this.variables = variables;
      }

      var nodes = this.parser.parse();
      var result;
      nodes.forEach(function (node) {
        this.visit(node);
      }.bind(this));
    }
  }]);
  return Interpreter;
}();

/**
 * Lala
 *
 * Copyright ©2017 Dana Basken <dbasken@gmail.com>
 *
 */
var Lala = function () {
  function Lala() {
    classCallCheck(this, Lala);


    this.lexicon = {
      ignore: {
        startTest: /[ \t\n;]/,
        test: /[ \t\n;]/
      },
      identifier: {
        startTest: /[a-zA-Z]/,
        test: /[a-zA-Z0-9_\.]/
      },
      number: {
        startTest: /[0-9]/,
        test: /[0-9\.]/
      },
      string: {
        startTest: /["]/,
        scanner: 'string'
      },
      operator: {
        startTest: /[\+\-\*\/><=|&!]/,
        test: /[\+\*\/><=|&!]/,
        values: ['=', '+', '-', '*', '/', '==', '!=', '>=', '<=', '<', '>', '||', '&&']
      },
      parenthesis: {
        startTest: /[\(\)]/
      },
      braces: {
        startTest: /[{}]/
      },
      punctuation: {
        startTest: /,/
      }
    };

    this.grammar = {
      operators: [{ value: '=', result: 'AssignmentExpression' }, { value: '+', result: 'MathExpression' }, { value: '-', result: 'MathExpression' }, { value: '*', result: 'MathExpression' }, { value: '/', result: 'MathExpression' }, { value: '==', result: 'ComparisonExpression' }, { value: '!=', result: 'ComparisonExpression' }, { value: '<=', result: 'ComparisonExpression' }, { value: '>=', result: 'ComparisonExpression' }, { value: '>', result: 'ComparisonExpression' }, { value: '<', result: 'ComparisonExpression' }, { value: '||', result: 'LogicalExpression' }, { value: '&&', result: 'LogicalExpression' }],
      reserved: ['if', 'else', 'upper', 'lower', 'format'],
      expressions: [{
        type: 'identifier',
        value: 'if',
        result: 'IfStatement',
        rules: [{ type: 'parenthesis', value: '(' }, { parse: 'term', result: 'test' }, { type: 'parenthesis', value: ')' }, { type: 'braces', value: '{' }, { parse: 'block', result: 'consequence' }, { type: 'braces', value: '}' }, { type: 'identifier', values: ['else'], optional: true }, { type: 'braces', value: '{' }, { parse: 'block', result: 'alternate' }, { type: 'braces', value: '}' }]
      }, {
        type: 'identifier',
        value: 'upper',
        result: 'UpperStatement',
        rules: [{ parse: 'factor', result: 'param' }]
      }, {
        type: 'identifier',
        value: 'lower',
        result: 'LowerStatement',
        rules: [{ parse: 'factor', result: 'param' }]
      }, {
        type: 'identifier',
        value: 'format',
        result: 'FormatStatement',
        rules: [{ parse: 'factor', result: 'format' }, { type: 'punctuation', value: ',' }, { parse: 'factor', result: 'param' }]
      }]
    };
  }

  createClass(Lala, [{
    key: 'setupBuiltinVariables',
    value: function setupBuiltinVariables(variables) {
      var date = new Date();
      variables.date = {
        now: Date.now(),
        day: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()],
        month: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'Auguest', 'September', 'October', 'November', 'December'][date.getMonth()],
        year: date.getFullYear()
      };
    }
  }, {
    key: 'check',
    value: function check(text, variables) {
      this.setupBuiltinVariables(variables);
      var lexer = new Lexer(this.lexicon, text);
      var parser = new Parser(this.grammar, lexer);
      return parser.parse();
    }
  }, {
    key: 'run',
    value: function run(text, variables) {
      this.setupBuiltinVariables(variables);
      var lexer = new Lexer(this.lexicon, text);
      var parser = new Parser(this.grammar, lexer);
      var interpreter = new Interpreter(parser);
      return {
        returnValue: interpreter.run(variables),
        variables: interpreter.variables
      };
    }
  }]);
  return Lala;
}();



Lala.Parser = Parser;
Lala.Lexer = Lexer;
Lala.ParseError = ParseError;
Lala.InterpretError = InterpretError;

return Lala;

})));
//# sourceMappingURL=Lala.umd.js.map
