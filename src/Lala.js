/**
 * Lala
 *
 * Copyright ©2017 Dana Basken <dbasken@gmail.com>
 *
 */
import Parser from './Parser.js';
import Lexer from './Lexer.js';
import Interpreter from './Interpreter.js';
import ParseError from './ParseError.js';
import InterpretError from './InterpretError.js';

class Lala {

  constructor() {

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
      string : {
        startTest: /["]/,
        scanner: 'string'
      },
      operator: {
        startTest: /[\+\-\*\/><=|&!]/,
        test: /[\+\*\/><=|&!~]/,
        values: ['=', '+', '-', '*', '/', '==', '!=', '>=', '<=', '<', '>', '=~', '||', '&&']
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
      operators: [
        {value: '=', result: 'AssignmentExpression'},
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
        {value: '=~', result: 'ComparisonExpression'},
        {value: '||', result: 'LogicalExpression'},
        {value: '&&', result: 'LogicalExpression'}
      ],
      reserved: ['if', 'else', 'upper', 'lower', 'format'],
      expressions: [
        {
          type: 'identifier',
          value: 'if',
          result: 'IfStatement',
          rules: [
            {type: 'parenthesis', value: '('},
            {parse: 'term', result: 'test'},
            {type: 'parenthesis', value: ')'},
            {type: 'braces', value: '{'},
            {parse: 'block', result: 'consequence'},
            {type: 'braces', value: '}'},
            {type: 'identifier', values: ['else'], optional: true},
            {type: 'braces', value: '{'},
            {parse: 'block', result: 'alternate'},
            {type: 'braces', value: '}'},
          ]
        },
        {
          type: 'identifier',
          value: 'upper',
          result: 'UpperStatement',
          rules: [
            {parse: 'factor', result: 'param'}
          ]
        },
        {
          type: 'identifier',
          value: 'lower',
          result: 'LowerStatement',
          rules: [
            {parse: 'factor', result: 'param'}
          ]
        },
        {
          type: 'identifier',
          value: 'format',
          result: 'FormatStatement',
          rules: [
            {parse: 'factor', result: 'format'},
            {type: 'punctuation', value: ','},
            {parse: 'factor', result: 'param'}
          ]
        }
      ]
    };

  };
  
  setupBuiltinVariables(variables) {
    var date = new Date();
    variables.date = {
      now: Date.now(),
      day: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()],
      month: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'Auguest', 'September', 'October', 'November', 'December'][date.getMonth()],
      year: date.getFullYear()
    }
  }

  check(text, variables) {
    this.setupBuiltinVariables(variables);
    var lexer = new Lexer(this.lexicon, text);
    var parser = new Parser(this.grammar, lexer);
    return parser.parse();
  };
  
  run(text, variables) {
    this.setupBuiltinVariables(variables);
    var lexer = new Lexer(this.lexicon, text);
    var parser = new Parser(this.grammar, lexer);
    var interpreter = new Interpreter(parser);
    return {
      returnValue: interpreter.run(variables),
      variables: interpreter.variables
    };
  }

};

Lala.Parser = Parser;
Lala.Lexer = Lexer;
Lala.ParseError = ParseError;
Lala.InterpretError = InterpretError;

export default Lala;
