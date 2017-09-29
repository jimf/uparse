# μparse

A tiny parser combinator library.

[![npm Version][npm-badge]][npm]
[![Build Status][build-badge]][build-status]
[![Test Coverage][coverage-badge]][coverage-result]
[![Dependency Status][dep-badge]][dep-status]

__μparse__ is a minimal parser combinator library, providing only a very basic
set of functions for consuming text and building up more complicated pattern
matchers. It is specifically _not_ focused on providing a breadth of
combinators, monadic APIs, or deep error reporting.

## Installation

Install using [npm][]:

    $ npm install --save uparse

## Usage

__μparse__ exposes two base combinators for consuming text:
[`str`](#strstring-formatter) and [`char`](#charcharacterclass-formatter).
These combinators consume a string and a character respectively. In addition we
have a number of combinators for building up more interesting parsers:
[`seq`](#seqparsers-formatter), [`rep`](#repparser-n-formatter),
[`opt`](#optparser-formatter), [`alt`](#altparsers-formatter), and
[`ref`](#refcontext-name). Lastly, [`parse`](#parseparser-string) takes a parser
and a string to apply the parser to. Matches return a nested object structure
containing the matched substring values, while misses return `null`.

See the [API](#api) section for more information on each of these functions.

```js
var P = require('uparse');

var number = P.alt([
    // Either 0
    P.str('0'),

    // Or a digit 0-9 followed by zero or more digits 0-9
    P.seq([
        P.char('1-9'),
        P.rep(P.char('0-9'), 0)
    ])
]);
var number = P.alt([P.str('0'), P.seq([P.char('1-9'), P.rep(P.char('0-9'), 0)])]);

P.parse(number, 'Hello!');
//=> null

P.parse(number, '123Hello!');
//=> null

P.parse(number, '000');
//=> null

P.parse(number, '2017');
//=> { alt:
//->    { seq:
//->       [ { char: '2' },
//->         { rep: [ { char: '0' }, { char: '1' }, { char: '7' } ] } ] } }
```

## API

__WARNING: Unstable__

This API hasn't been fully vetted yet, and is subject to change before 1.0.0.

#### `parse(parser, string)`

The `parse` function accepts a __μparse__ parser (see below) and a string to
apply the parser to. If the parser successfully matches the string, the details
of what was matched are returned. Otherwise, the return value is `null`.

#### `str(string, [formatter])`

The `str` combinator accepts a string and an optional formatter function and
returns a parser that consumes the exact string given.

The formatter function may be specified to map the return value of a success.
By default, matches on `str` will return `{ str: 'the matched text' }`.

```js
var hello = P.str('hello');

P.parse(hello, 'hello');
//=> { str: "hello" }

P.parse(hello, 'world');
//=> null
```

#### `char(characterClass, [formatter])`

The `char` combinator accepts a character class (e.g., " ", "0-9", "a-z", etc.)
and an optional formatter function and returns a parser that consumes a single
character that matches the given character class.

The formatter function may be specified to map the return value of a success.
By default, matches on `char` will return `{ char: 'c' }`, where `'c'` is the
matched character.

```js
var digit = P.char('0-9');

P.parse(digit, '3');
//=> { char: "3" }

P.parse(digit, 'h');
//=> null
```

#### `seq(parsers, [formatter])`

The `seq` combinator accepts an array of parsers and an optional formatter
function and returns a parser that matches against each of the given parsers in
turn. The parser only succeeds if the entire parser sequence succeeds, in the
order given.

The optional formatter function may be specified to map the return value of a
success. By default, matches on `seq` will return
`{ seq: [<results of inner parsers>] }`.

```js
var helloWorld = P.seq([P.str('hello'), P.str(' world')]);

P.parse(helloWorld, 'hello world');
//=> { seq: [ { str: "hello" },
//->          { str: " world" } ] }

P.parse(hello, 'hello world!');
//=> null
```

#### `rep(parser, n, [formatter])`

The `rep` combinator accepts a parser, a number of minimum times to match the
parser, and an optional formatter function. The returned parser matches the
given parser repeatedly, as many times as possible. The parser only succeeds if
the number of successful matches meets the minimum number specified.

`rep` may be familiar to those who are familiar with regular expression `*` and
`+` operators. To replicate these operators, `n` should be specified as `0` or
`1` respectively.

The formatter function may be specified to map the return value of a success.
By default, matches on `rep` will return
`{ rep: [<results of inner parsers>] }`.

```js
var number = P.rep(P.char('0-9'), 1);

P.parse(number, '42');
//=> { rep: [ { char: "4" },
//->          { char: "2" } ] }

P.parse(number, 'hi');
//=> null
```

#### `opt(parser, [formatter])`

The `opt` combinator accepts a parser and an optional formatter function and
returns a parser that succeeds if the given parser matches zero or one times.

The formatter function may be specified to map the return value of a success.
By default, matches on `opt` will return
`{ opt: <results of optional parser> }`, where `<results of optional parser>`
will be exactly that if matched once, and `null` if matched 0 times.

```js
var maybePlus = P.opt(P.str('+'));

P.parse(maybePlus, '+');
//=> { opt: { str: "+" } }

P.parse(maybePlus, '');
//=> { opt: null }

P.parse(maybePlus, 'hi');
//=> null
```

#### `alt(parsers, [formatter])`

The `alt` combinator accepts an array of parsers and an optional formatter
function and returns a parser that matches against each of the given parsers in
turn, immediately succeeding and consuming the match for the first parser that
succeeds.

The optional formatter function may be specified to map the return value of a
success. By default, matches on `alt` will return
`{ alt: <result of matched parser> }`.

```js
var unit = P.alt([P.str('fahrenheit'), P.str('celsius'), P.str('kelvin')]);

P.parse(unit, 'celsius');
//=> { alt: { str: "celsius" } }

P.parse(hello, 'hello world!');
//=> null
```

#### `ref(context, name)`

The final combinator, `ref`, is very different from the others, and exists to
solve the problem of defining parsers for recursive patterns.  The `ref`
combinator accepts a context object and the name of a key on the context
object. The returned parser will then lazily look up the given name on the
context object, treating the corresponding value to be the parser to use at
evaluation time when needed.

```js
var context = { hello: P.str('hello') };
context.helloRef = P.ref(context, 'hello');

P.parse(context.helloRef, 'hello');
//=> { str: "hello" }

P.parse(context.helloRef, 'hello world');
//=> null
```

## License

MIT

[build-badge]: https://img.shields.io/travis/jimf/uparse/master.svg
[build-status]: https://travis-ci.org/jimf/uparse
[npm-badge]: https://img.shields.io/npm/v/uparse.svg
[npm]: https://www.npmjs.org/package/uparse
[coverage-badge]: https://img.shields.io/coveralls/jimf/uparse.svg
[coverage-result]: https://coveralls.io/r/jimf/uparse
[dep-badge]: https://img.shields.io/david/jimf/uparse.svg
[dep-status]: https://david-dm.org/jimf/uparse
