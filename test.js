var test = require('tape')
var P = require('./index')
var parse = P.parse

test('str combinator', function (t) {
  var hello = P.str('hello')
  var appendWorld = function (v) { return v.str + ' world' }
  t.deepEqual(parse(hello, 'hello'), { str: 'hello' }, 'matches an exact string')
  t.equal(parse(hello, 'world'), null, 'fails non-matching strings')
  t.equal(parse(P.str('hello', appendWorld), 'hello'), 'hello world', 'accepts optional formatting function')
  t.end()
})

test('char combinator', function (t) {
  var digit = P.char('0-9')
  var toNumber = function (v) { return Number(v.char) }
  t.deepEqual(parse(digit, '5'), { char: '5' }, 'matches a single character from a character class')
  t.equal(parse(digit, 'z'), null, 'fails non-matching strings')
  t.equal(parse(P.char('0-9', toNumber), '9'), 9, 'accepts optional formatting function')
  t.end()
})

test('seq combinator', function (t) {
  var number = P.char('0-9')
  var addition = P.seq([number, P.str('+'), number])
  var format = function (v) { return ['+', Number(v.seq[0].char), Number(v.seq[2].char)] }
  var additionFormatted = P.seq([number, P.str('+'), number], format)
  t.deepEqual(
    parse(addition, '2+5'),
    { seq: [{ char: '2' }, { str: '+' }, { char: '5' }] },
    'matches a sequence of parsers'
  )
  t.equal(parse(addition, '2+z'), null, 'fails non-matching strings')
  t.deepEqual(parse(additionFormatted, '2+8'), ['+', 2, 8], 'accepts optional formatting function')
  t.end()
})

test('rep combinator', function (t) {
  var numbers = P.rep(P.char('0-9'), 2)
  var format = function (v) { return '#' + v.rep.map(function (w) { return w.char }).join('') }
  var numbersFormatted = P.rep(P.char('0-9'), 1, format)
  t.deepEqual(
    parse(numbers, '2017'),
    { rep: [{ char: '2' }, { char: '0' }, { char: '1' }, { char: '7' }] },
    'matches a parser repeatedly'
  )
  t.equal(parse(numbers, 'asdf'), null, 'fails non-matching strings')
  t.equal(parse(numbers, '1'), null, 'fails if minimum number of matches are not met')
  t.equal(parse(numbersFormatted, '00358'), '#00358', 'accepts optional formatting function')
  t.end()
})

test('opt combinator', function (t) {
  var maybeplus = P.opt(P.str('+'))
  var format = function (v) { return '#' + v.opt && v.opt.str }
  var maybeplusFormatted = P.opt(P.str('+'), format)
  t.deepEqual(
    parse(maybeplus, '+'),
    { opt: { str: '+' } },
    'matches a matching parser'
  )
  t.deepEqual(
    parse(maybeplus, ''),
    { opt: null },
    'matches if optional pattern is not found'
  )
  t.equal(parse(maybeplus, 'asdf'), null, 'fails non-matching strings')
  t.equal(parse(maybeplusFormatted, '+'), '+', 'accepts optional formatting function')
  t.end()
})

test('alt combinator', function (t) {
  var redOrBlue = P.alt([P.str('red'), P.str('blue')])
  var format = function (v) { return { color: v.alt.str } }
  var redOrBlueFormatted = P.alt([P.str('red'), P.str('blue')], format)
  t.deepEqual(
    parse(redOrBlue, 'blue'),
    { alt: { str: 'blue' } },
    'matches the first matching parser'
  )
  t.equal(parse(redOrBlue, 'green'), null, 'fails non-matching strings')
  t.deepEqual(parse(redOrBlueFormatted, 'red'), { color: 'red' }, 'accepts optional formatting function')
  t.end()
})

test('ref combinator', function (t) {
  var ctx = { number: P.char('0-9') }
  var numberRef = P.ref(ctx, 'number')
  t.deepEqual(
    parse(numberRef, '4'),
    { char: '4' },
    'matches against parser defined in context by name'
  )
  t.equal(parse(numberRef, 'z'), null, 'fails non-matching strings')
  t.end()
})
