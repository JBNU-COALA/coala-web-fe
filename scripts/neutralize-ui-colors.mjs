import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const apply = process.argv.includes('--write')
const gray = (r, g, b) => Math.round(.2126 * r + .7152 * g + .0722 * b)
const byte = (n) => n.toString(16).padStart(2, '0')
let changed = 0
async function visit(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name)
    if (entry.isDirectory()) { await visit(file); continue }
    if (!file.endsWith('.css')) continue
    if (entry.name === 'hero-art-colors.css') continue // Explicitly approved forest illustration colors.
    const before = await readFile(file, 'utf8')
    let after = before.replace(/#([\da-f]{8}|[\da-f]{6}|[\da-f]{4}|[\da-f]{3})(?![\w-])/gi, (original, hex) => {
      const expanded = hex.length < 5 ? [...hex].map((digit) => digit + digit).join('') : hex
      const [r, g, b] = [0, 2, 4].map((offset) => parseInt(expanded.slice(offset, offset + 2), 16))
      if (r === g && g === b) return original
      return '#' + byte(gray(r, g, b)).repeat(3) + expanded.slice(6)
    })
    after = after.replace(/\b(rgba?)\(\s*(\d+(?:\.\d+)?)\s*([, ])\s*(\d+(?:\.\d+)?)\s*[, ]\s*(\d+(?:\.\d+)?)([^)]*)\)/gi, (original, fn, r, separator, g, b, tail) => {
      if (+r === +g && +g === +b) return original
      const value = gray(+r, +g, +b)
      return `${fn}(${[value, value, value].join(separator === ',' ? ', ' : ' ')}${tail})`
    })
    if (after !== before) {
      changed++
      if (apply) await writeFile(file, after)
      else console.log(file)
    }
  }
}
await visit('src')
console.log(`${changed} CSS files ${apply ? 'neutralized' : 'contain non-neutral color literals'}.`)
if (!apply && changed) process.exitCode = 1
