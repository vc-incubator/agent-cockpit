// Same cases as agent-team-template/tests/yaml-lite.test.mjs: the two parsers are kept in
// lockstep, so a done block that reads one way there has to read the same way here.
import test from 'node:test'
import assert from 'node:assert/strict'
import { parseSimpleYaml } from '../api/yaml-lite.js'

// --- an owner's sentence keeps its commas ------------------------------------------------

// Phase 12 writes the owner's own words into a done block. Split on every comma, a rule like
// "no tax, legal or payroll advice" became three rules, two of them fragments, and the editor
// marked drafts against the fragments. Found on a live student install, 2026-09-24.
test('a quoted item in an inline list keeps its commas', () => {
  const parsed = parseSimpleYaml(
    'done:\n  never: ["no tax, legal or payroll advice", a guilt trip]\n'
  )
  assert.deepEqual(parsed.done.never, ['no tax, legal or payroll advice', 'a guilt trip'])
})

test('single quotes work too, and a doubled one is an apostrophe', () => {
  const parsed = parseSimpleYaml("never: ['the client''s NIT, if known', exclamation marks]\n")
  assert.deepEqual(parsed.never, ["the client's NIT, if known", 'exclamation marks'])
})

// An apostrophe inside a word is not a quote. If it opened one, everything after it would be
// swallowed into a single item.
test('an apostrophe mid-item does not open a quote', () => {
  const parsed = parseSimpleYaml("never: [the client's deadline, a promised date]\n")
  assert.deepEqual(parsed.never, ["the client's deadline", 'a promised date'])
})

test('a quote that starts mid-item is plain text, as in the shipped draft queue', () => {
  const parsed = parseSimpleYaml(
    'never: [hashtag stacks, filler openings such as "in today\'s fast-paced world", a claim with no source]\n'
  )
  assert.equal(parsed.never.length, 3)
  assert.equal(parsed.never[1], 'filler openings such as "in today\'s fast-paced world"')
})

// Unquoted, a comma is a separator. That is YAML's rule, so a sentence with commas has to be
// quoted by whoever writes it; the parser should not guess.
test('an unquoted item still splits on every comma', () => {
  assert.deepEqual(parseSimpleYaml('tags: [a, b, c]\n').tags, ['a', 'b', 'c'])
})

test('an empty list is empty, and a lone quoted item is one item', () => {
  assert.deepEqual(parseSimpleYaml('a: []\n').a, [])
  assert.deepEqual(parseSimpleYaml('a: ["one, whole"]\n').a, ['one, whole'])
})

test('a quoted scalar outside a list is unchanged', () => {
  assert.equal(parseSimpleYaml('name: "Receipt Chase, monthly"\n').name, 'Receipt Chase, monthly')
})
