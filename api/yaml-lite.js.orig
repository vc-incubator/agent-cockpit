// A deliberately small YAML subset: flat keys, one level of nesting, inline `[a, b]` or
// dashed lists. Anything richer is a sign a config file is drifting away from something a
// person can read at a glance — and every file this parses is one a student can read.
//
// Ported from agent-team-template/scripts/lib/yaml-lite.mjs. Keep the two in lockstep:
// the cockpit must parse workflows/*.yml, tiles.yml and runtimes.yml exactly the way the
// template's own validation does, or a file that passes there could break here.

function scalar(raw) {
  const value = raw.trim()
  if (value === '') return ''
  if (value === 'true') return true
  if (value === 'false') return false
  if (value === 'null' || value === '~') return null
  if (/^-?\d+$/.test(value)) return Number(value)
  const quoted = /^(["'])([\s\S]*)\1$/.exec(value)
  if (quoted) return quoted[2]
  return value
}

function inlineList(raw) {
  const inner = raw.trim().slice(1, -1).trim()
  if (inner === '') return []
  return inner.split(',').map((item) => scalar(item))
}

function isInline(rest) {
  const trimmed = rest.trim()
  return trimmed.startsWith('[') && trimmed.endsWith(']')
}

export function parseSimpleYaml(source) {
  const lines = String(source ?? '').replace(/\r\n/g, '\n').split('\n')
  const root = {}
  let openKey = null

  for (const line of lines) {
    if (!line.trim() || line.trim().startsWith('#')) continue

    // A dashed item belongs to whichever bare key opened most recently. Items can be plain
    // scalars or `- key: value` maps, which is how runtimes.yml lists entries.
    const item = /^\s+-\s+(.*)$/.exec(line)
    if (item && openKey) {
      if (!Array.isArray(root[openKey])) root[openKey] = []
      const pair = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(item[1])
      if (pair) root[openKey].push({ [pair[1]]: scalar(pair[2]) })
      else root[openKey].push(scalar(item[1]))
      continue
    }

    const pair = /^(\s*)([A-Za-z0-9_-]+):\s*(.*)$/.exec(line)
    if (!pair) continue
    const [, indent, key, rest] = pair

    if (indent !== '' && openKey) {
      const bucket = root[openKey]
      // Continuation of the last `- key: value` entry in a list, or a child of a bare map key.
      if (Array.isArray(bucket) && bucket.length && typeof bucket[bucket.length - 1] === 'object') {
        bucket[bucket.length - 1][key] = isInline(rest) ? inlineList(rest) : scalar(rest)
        continue
      }
      if (!bucket || typeof bucket !== 'object' || Array.isArray(bucket)) root[openKey] = {}
      root[openKey][key] = isInline(rest) ? inlineList(rest) : scalar(rest)
      continue
    }

    if (rest === '') {
      // A bare key. The lines that follow decide whether it is a map or a list.
      openKey = key
      root[key] = {}
      continue
    }

    openKey = null
    root[key] = isInline(rest) ? inlineList(rest) : scalar(rest)
  }

  return root
}
