import Parser from './Parser.js';
import Lexer from './Lexer.js';
import Interpreter from './Interpreter.js';

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
      operator: {
        startTest: /[\+\-\*\/><=|&!]/,
        test: /[\+\-\*\/><=|&!]/,
        values: ['+', '-', '*', '/', '=', '==', '!=', '>=', '<=', '<', '>', '||', '&&']
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
  
  run(text, variables, callback) {
    var lexer = new Lexer(this.lexicon, text);
    var parser = new Parser(this.grammar, lexer);
    var interpreter = new Interpreter(parser);
    return interpreter.run(variables, callback);
  }

};

export default Lala;
