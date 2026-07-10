import { readdir, readFile } from 'node:fs/promises'
import { extname, join, relative } from 'node:path'

const root = process.cwd()
const ignoredDirectories = new Set(['.git', '.agents', 'node_modules'])
const textExtensions = new Set([
  '.css',
  '.html',
  '.js',
  '.json',
  '.md',
  '.mjs',
  '.ts',
  '.tsx',
  '.txt',
  '.yml',
  '.yaml',
])
const cyrillicPattern = /[\u0400-\u04ff]/u

async function collect(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue
    const path = join(directory, entry.name)
    if (entry.isDirectory()) files.push(...await collect(path))
    else if (textExtensions.has(extname(entry.name)) || entry.name.startsWith('.env')) files.push(path)
  }
  return files
}

const matches = []
for (const file of await collect(root)) {
  const content = await readFile(file, 'utf8')
  if (cyrillicPattern.test(content)) matches.push(relative(root, file))
}

if (matches.length > 0) {
  console.error(`Cyrillic characters found in: ${matches.join(', ')}`)
  process.exitCode = 1
} else {
  console.log('Content check passed: no Cyrillic characters found.')
}
