/**
 * Syntax colouring for the demo sources, done at build time.
 *
 * A highlighting library would be the obvious answer and is the wrong one: it
 * would either ship a parser to every reader to decorate markup that cannot
 * change after the build, or add a heavyweight build dependency to a site whose
 * whole argument is that the platform is enough. What is being coloured is the
 * files in demos/cases — modern TSX, a few dozen lines each.
 *
 * It is a scanner, not a parser, and it does not pretend otherwise. It knows
 * three modes, because two of them are the difference between colouring code
 * and colouring the words a demo puts on a button:
 *
 *   code   expressions and statements — keywords, calls, components
 *   tag    inside `<` and `>` — the element name and its attributes
 *   text   an element's children — prose, and left alone
 *
 * Without `text`, `<Popover.Trigger>Filters</Popover.Trigger>` colours "Filters"
 * as a component, and every menu item in the demos reads as code.
 */

const KEYWORDS = new Set([
  'as',
  'async',
  'await',
  'break',
  'case',
  'catch',
  'class',
  'const',
  'continue',
  'default',
  'delete',
  'do',
  'else',
  'export',
  'extends',
  'false',
  'finally',
  'for',
  'from',
  'function',
  'if',
  'implements',
  'import',
  'in',
  'instanceof',
  'interface',
  'keyof',
  'let',
  'new',
  'null',
  'of',
  'readonly',
  'return',
  'satisfies',
  'static',
  'switch',
  'this',
  'throw',
  'true',
  'try',
  'type',
  'typeof',
  'undefined',
  'var',
  'void',
  'while',
  'yield',
])

/**
 * Ordered, and the order is the design.
 *
 * Comments come first so an apostrophe in prose cannot open a string, and
 * strings come next so a `<` inside one cannot open a tag. Punctuation is one
 * character at a time because the structural ones — `<`, `>`, `{`, `}` — are
 * what move the scanner between modes; adjacent tokens are merged back into a
 * single span when the HTML is written.
 */
const TOKEN = new RegExp(
  [
    String.raw`(?<comment>\/\/[^\n]*|\/\*[\s\S]*?\*\/)`,
    String.raw`(?<string>'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|\`(?:[^\`\\]|\\.)*\`)`,
    String.raw`(?<number>\d[\w.]*)`,
    String.raw`(?<word>[A-Za-z_$][\w$]*)`,
    String.raw`(?<blank>\s+)`,
    String.raw`(?<punctuation>[^\s\w$])`,
  ].join('|'),
  'y',
)

/** An element's children, up to the next tag or expression. */
const TEXT = /[^<{]+/y

export function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * `<` opens an element here, or compares two things, or opens a type argument.
 *
 * Only the token before it tells them apart, and the rule is the one every
 * JSX-aware editor uses: a value cannot be followed by a tag, so `a < b` and
 * `useState<number[]>` are comparisons where `return (<div>` is markup.
 */
function opensTag(previous) {
  if (previous === null) return true
  if (previous.kind === 'keyword') return true
  return previous.kind === 'punctuation' && previous.text !== ')' && previous.text !== ']'
}

/** A bare word in code: a keyword, a component or type, a call, or nothing. */
function classifyWord(word, rest) {
  if (KEYWORDS.has(word)) return 'keyword'
  if (/^[A-Z]/.test(word)) return 'type'
  // A type argument counts as a call site, so `useState<number[]>(…)` and
  // `useState(1)` are the same colour two lines apart. Capitalised words are
  // already gone above, so `Array<string>` stays a type.
  // 40 characters is well past the longest `name (` worth caring about, and
  // keeps this from slicing the rest of the file once per identifier.
  return /^\s*[(<]/.test(rest) ? 'call' : null
}

function* scan(source) {
  let index = 0
  let mode = 'code'
  let depth = 0
  /** Where to return when the current element or expression closes. */
  const frames = []
  /** The last token that carries meaning, for `opensTag`. */
  let previous = null
  /** Inside a tag, before its name has been read. */
  let naming = false
  /** Inside a tag that closes an element rather than opening one. */
  let closing = false

  const enterTag = () => {
    closing = source[index + 1] === '/'
    if (!closing) frames.push({ mode, depth })
    mode = 'tag'
    naming = true

    const text = closing ? '</' : '<'
    index += text.length
    return { kind: 'punctuation', text }
  }

  const leaveElement = () => {
    const frame = frames.pop() ?? { mode: 'code', depth: 0 }
    mode = frame.mode
    depth = frame.depth
    previous = null
  }

  while (index < source.length) {
    if (mode === 'text') {
      TEXT.lastIndex = index
      const text = TEXT.exec(source)

      if (text) {
        index = TEXT.lastIndex
        yield { kind: null, text: text[0] }
      } else if (source[index] === '{') {
        frames.push({ mode, depth })
        mode = 'code'
        depth = 0
        previous = null
        index += 1
        yield { kind: 'punctuation', text: '{' }
      } else {
        yield enterTag()
      }

      continue
    }

    TOKEN.lastIndex = index
    const match = TOKEN.exec(source)

    // Nothing the scanner recognises. Emit it and keep going rather than stop:
    // a source file must come out of here whole, coloured or not.
    if (!match) {
      const text = source[index]
      index += 1
      yield { kind: null, text }
      continue
    }

    const [text] = match
    const [kind] = Object.entries(match.groups).find(([, value]) => value !== undefined)

    if (kind === 'punctuation' && mode === 'code' && text === '<' && opensTag(previous)) {
      yield enterTag()
      continue
    }

    index = TOKEN.lastIndex

    if (kind === 'punctuation') {
      if (mode === 'tag') {
        if (text === '>') {
          if (closing) leaveElement()
          else mode = 'text'
        } else if (text === '/' && source[index] === '>') {
          index += 1
          leaveElement()
          yield { kind: 'punctuation', text: '/>' }
          continue
        } else if (text === '{') {
          frames.push({ mode, depth })
          mode = 'code'
          depth = 0
          previous = null
        }
      } else if (text === '{') {
        depth += 1
      } else if (text === '}') {
        // The brace that closes the expression this frame was opened for, as
        // opposed to one of the blocks inside it.
        if (depth === 0 && frames.length > 0) leaveElement()
        else depth -= 1
      }
    }

    let name = kind === 'blank' ? null : kind

    if (kind === 'word') {
      if (mode !== 'tag') name = classifyWord(text, source.slice(index, index + 40))
      // An element and a component are the same kind of thing on this site, and
      // are coloured alike — but the scanner knows which it saw.
      else if (!naming) name = 'attribute'
      else name = /^[a-z]/.test(text) ? 'tag' : 'type'
    }

    if (kind === 'blank' && mode === 'tag') naming = false
    if (kind !== 'blank' && kind !== 'comment') previous = { kind, text }

    yield { kind: name, text }
  }
}

/** TSX source as HTML: escaped, with the interesting parts wrapped in spans. */
export function highlight(source) {
  const tokens = []

  for (const token of scan(source)) {
    const last = tokens.at(-1)
    if (last !== undefined && last.kind === token.kind) last.text += token.text
    else tokens.push({ ...token })
  }

  return tokens
    .map(({ kind, text }) =>
      kind === null ? escapeHtml(text) : `<span class="tok-${kind}">${escapeHtml(text)}</span>`,
    )
    .join('')
}
