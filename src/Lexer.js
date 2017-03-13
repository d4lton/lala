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

  scan(regex) {
    var result = this.current;
    if (regex) {
      while ((typeof this.peek() !== 'undefined') && regex.test(this.peek())) {
        result += this.next();
      };
    }
    return result;
  };

  classify(type, value) {
    var result = {
      type: type,
      value: value
    };
    return result;
  };

  getToken() {
    if (!this.end()) {
      var c = this.next();
      var types = Object.keys(this.lexicon);
      for (var i = 0; i < types.length; i++) {
        var type = types[i];
        if (this.lexicon[type].startTest.test(c)) {
          var value = this.scan(this.lexicon[type].test);
          if (this.lexicon[type].values && this.lexicon[type].values.indexOf(value) === -1) {
            throw new Error(value + ' token matches ' + type + ' regex, but not one of ' + this.lexicon[type].values.join(','));
          }
          return {
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

};

export default Lexer;
