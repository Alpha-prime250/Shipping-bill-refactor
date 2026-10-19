// Runs every `src/**/*.test.ts` with Node's built-in test runner. Tests are bundled with esbuild (already a
// dev dependency) so the `@/` alias and extensionless imports work; no extra test dependency is needed.
import { build } from 'esbuild'
import { spawnSync } from 'node:child_process'
import { mkdirSync, readdirSync, rmSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const outdir = join(root, 'node_modules/.tmp/tests')

const findTests = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return findTests(path)
    return entry.name.endsWith('.test.ts') ? [path] : []
  })

const entryPoints = findTests(join(root, 'src'))
rmSync(outdir, { recursive: true, force: true })
mkdirSync(outdir, { recursive: true })

await build({
  entryPoints,
  outdir,
  outbase: join(root, 'src'),
  bundle: true,
  platform: 'node',
  format: 'esm',
  alias: { '@': join(root, 'src') },
  logLevel: 'warning'
})

// Node's runner takes file paths, not a directory: point it at the bundled copy of each test file.
const bundled = entryPoints.map((file) => join(outdir, relative(join(root, 'src'), file).replace(/\.ts$/, '.js')))
const result = spawnSync(process.execPath, ['--test', ...bundled], { stdio: 'inherit' })
process.exit(result.status ?? 1)
