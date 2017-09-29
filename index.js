function id (val) { return val }

/* ==== Private state container =========================================== */

/**
 * Parser state object.
 *
 * @param {string} string String to parse
 * @param {number} offset Cursor location of state object
 */
function ParseState (string, offset) {
  this.string = string
  this.offset = offset
}

/**
 * Retrieve the next n characters of the string without advancing the cursor.
 *
 * @param {number} n Number of characters to return
 * @return {string}
 */
ParseState.prototype.peek = function (n) {
  return this.string.slice(this.offset, this.offset + n)
}

/**
 * Return a new parse state with the cursor advanced n characters.
 *
 * @param {number} n Number of characters to advance cursor
 * @return {ParseState}
 */
ParseState.prototype.read = function (n) {
  return new ParseState(this.string, this.offset + n)
}

/**
 * Return whether the end of the string has been reached.
 *
 * @return {boolean}
 */
ParseState.prototype.isComplete = function () {
  return this.offset === this.string.length
}

/* ==== Public interface ================================================== */

/**
 * Apply a parser to a given string.
 *
 * @param {function} parser Parser to apply
 * @param {string} string String to parse
 * @return {*|null}
 */
function parse (parser, string) {
  var result = parser(new ParseState(string, 0))
  return result && result[1].isComplete() ? result[0] : null
}

/* ==== Combinators ======================================================= */

/**
 * String combinator. Matches an exact string.
 *
 * @param {string} string String to match
 * @param {function} [f] Optional result formatter
 * @return {function} parser
 */
function str (string, f) {
  f = f || id
  return function (parseState) {
    var chunk = parseState.peek(string.length)
    return chunk === string
      ? [f({ str: chunk }), parseState.read(string.length)]
      : null
  }
}

/**
 * Character combinator. Matches a single character.
 *
 * @param {string} chars Character pattern to match.
 * @param {function} [f] Optional result formatter
 * @return {function} parser
 */
function char (chars, f) {
  f = f || id
  return function (parseState) {
    var chunk = parseState.peek(1)
    var regex = new RegExp('[' + chars + ']')
    return regex.test(chunk)
      ? [f({ char: chunk }), parseState.read(1)]
      : null
  }
}

/**
 * Sequence combinator. Matches a sequence of parsers.
 *
 * @param {function[]} parsers Array of parsers to test in sequence
 * @param {function} [f] Optional result formatter
 * @return {function} parser
 */
function seq (parsers, f) {
  f = f || id
  return function (parseState) {
    var result = parsers.reduce(function (acc, parser) {
      if (!acc.success) { return acc }
      var parsed = parser(acc.state)
      if (parsed) {
        acc.matches.push(parsed[0])
        acc.state = parsed[1]
      } else {
        acc.success = false
      }
      return acc
    }, { success: true, state: parseState, matches: [] })

    return result.success
      ? [f({ seq: result.matches }), result.state]
      : null
  }
}

/**
 * Repitition combinator. Matches a parser as many times as possible.
 *
 * @param {function} parser Parser to test against
 * @param {number} n Minimum number of matches to consider success
 * @param {function} [f] Optional result formatter
 * @return {function} parser
 */
function rep (parser, n, f) {
  f = f || id
  return function (parseState) {
    var matches = []
    var lastState = null
    var parsed

    while (parseState) {
      lastState = parseState
      parsed = parser(parseState)
      if (parsed) {
        matches.push(parsed[0])
        parseState = parsed[1]
      } else {
        parseState = null
      }
    }

    return matches.length >= n
      ? [f({ rep: matches }), lastState]
      : null
  }
}

/**
 * Optional combinator. Matches a parser 0 or 1 times.
 *
 * @param {function} parser Parser to test against
 * @param {function} [f] Optional result formatter
 * @return {function} parser
 */
function opt (parser, f) {
  f = f || id
  return function (parseState) {
    var parsed = parser(parseState)
    return parsed
      ? [f({ opt: parsed[0] }), parsed[1]]
      : [f({ opt: null }), parseState]
  }
}

/**
 * Alternative combinator. Matches the first parser to pass.
 *
 * @param {function[]} parsers Array of parsers to test against
 * @param {function} [f] Optional result formatter
 * @return {function} parser
 */
function alt (parsers, f) {
  f = f || id
  return function (parseState) {
    var result

    for (var i = 0, len = parsers.length; i < len; i += 1) {
      result = parsers[i](parseState)
      if (result) {
        return [f({ alt: result[0] }), result[1]]
      }
    }

    return null
  }
}

/**
 * Reference combinator. Lazy parser that dispatches to a named parser on a
 * context object.
 *
 * @param {object} ctx Context to find method on
 * @param {string} name Parser name to dispatch to
 * @return {function} parser
 */
function ref (ctx, name) {
  return function (parseState) {
    return ctx[name](parseState)
  }
}

exports.parse = parse
exports.str = str
exports.char = char
exports.seq = seq
exports.rep = rep
exports.opt = opt
exports.alt = alt
exports.ref = ref
