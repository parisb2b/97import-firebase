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
  // V46 Checkpoint B — Code-splitting des grosses dépendances vendor.
  // Le bundle index principal était à 2.91 MB (gzip 803 kB). On extrait
  // firebase, pdf, excel, dnd-kit dans des chunks séparés, partagés
  // entre routes et mieux cachables côté navigateur.
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: (id: string) => {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('/firebase/') || id.includes('@firebase/')) return 'firebase-vendor';
          if (
            id.includes('/jspdf') ||
            id.includes('/html2canvas') ||
            id.includes('/dompurify') ||
            id.includes('/purify.es')
          ) return 'pdf-vendor';
          if (id.includes('/exceljs') || id.includes('/xlsx')) return 'excel-vendor';
          if (id.includes('/@dnd-kit/')) return 'ui-vendor';
          return undefined;
        },
      },
    },
  },
})
