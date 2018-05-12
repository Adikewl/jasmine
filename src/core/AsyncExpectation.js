getJasmineRequireObj().AsyncExpectation = function(j$) {
  var promiseForMessage = {
    jasmineToString: function() { return 'a promise'; }
  };

  function AsyncExpectation(options) {
    var global = options.global || j$.getGlobal();
    this.util = options.util || { buildFailureMessage: function() {} };
    this.customEqualityTesters = options.customEqualityTesters || [];
    this.actual = options.actual;
    this.addExpectationResult = options.addExpectationResult || function(){};

    if (!global.Promise) {
      throw new Error('expect.async is unavailable because the environment does not support promises.');
    }

    if (!j$.isPromise(this.actual)) {
      throw new Error('Expected expect.async to be called with a promise.');
    }

    ['toBeResolved', 'toBeRejected', 'toBeResolvedTo'].forEach(wrapCompare.bind(this));
  }

  function wrapCompare(name) {
    var compare = this[name];
    this[name] = function() {
      var self = this;
      var args = Array.prototype.slice.call(arguments);
      args.unshift(this.actual);
      return compare.apply(self, args).then(function(compareResult) {
        // TODO: Is it possible to use the stack trace for where expect.async
        // was called rather than where the matcher failed? The latter is
        // useless, containing only Jasmine frames.
        self.addExpectationResult(compareResult.pass, {
          matcherName: name,
          passed: compareResult.pass,
          message: compareResult.message ||
            self.util.buildFailureMessage(name, false, promiseForMessage),
          error: undefined,
          actual: self.actual
        });
      });
    };
  }

  AsyncExpectation.prototype.toBeResolved = function(actual) {
    return actual.then(
      function() { return {pass: true}; },
      function() { return {pass: false}; }
    );
  };

  AsyncExpectation.prototype.toBeRejected = function(actual) {
    return actual.then(
      function() { return {pass: false}; },
      function() { return {pass: true}; }
    );
  };

  AsyncExpectation.prototype.toBeResolvedTo = function(actualPromise, expectedValue) {
    var self = this,
      msgPrefix = 'Expected a promise to be resolved to ' +
        j$.pp(expectedValue);

    return actualPromise.then(
      function(actualValue) {
        if (self.util.equals(actualValue, expectedValue, self.customEqualityTesters)) {
          return {
           pass: true,
           message: msgPrefix + '.'
         };
        } else {
          return {
            pass: false,
            message: msgPrefix + ' but it was resolved to ' + j$.pp(actualValue) + '.'
          };
        }
      },
      function() {
        return {
          pass: false,
          message: msgPrefix + ' but it was rejected.'
        };
      }
    );
  };


  AsyncExpectation.factory = function(options) {
    return new AsyncExpectation(options);
  };


  return AsyncExpectation;
};
