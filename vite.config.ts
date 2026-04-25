import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

// ── Métadonnées de build injectées dans le bundle (badge version v43-mini) ──
// On injecte des DONNÉES BRUTES (ISO 8601 UTC) — le formatage en heure de Paris
// est fait à l'affichage dans src/lib/version.ts (formatBuildDate).
const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))

let commitHash = 'dev'
try {
  commitHash = execSync('git rev-parse --short HEAD').toString().trim()
} catch {
  // git non disponible (env CI sans .git, etc.) — on garde 'dev'
}

const buildIsoUtc = new Date().toISOString()  // ex: "2026-04-25T17:55:30.123Z"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_ISO__: JSON.stringify(buildIsoUtc),
    __COMMIT_HASH__: JSON.stringify(commitHash),
  },
})
