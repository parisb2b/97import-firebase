import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

// ── M1009 — Isolation HMR : ignorer les dossiers de données et logs ──
// Stopper les rafraîchissements intempestifs causés par les exports
// Firebase, logs, backups et le cache Vite lui-même.

// ── Métadonnées de build injectées dans le bundle (badge version) ──
const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))

let commitHash = 'dev'
try {
  commitHash = execSync('git rev-parse --short HEAD').toString().trim()
} catch {
  // git non disponible (env CI sans .git, etc.)
}

const buildIsoUtc = new Date().toISOString()

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  // ── M1009 §2.1 — Isolation HMR ──
  server: {
    watch: {
      ignored: [
        '**/firebase_data/**',
        '**/firebase-export*/**',
        '**/node_modules/.vite/**',
        '**/DP/**',
        '**/docs/**',
        '**/*.log',
        '**/firebase-debug.log',
        '**/firestore-debug.log',
        '**/auth_export/**',
        '**/storage_export/**',
        '**/ui-debug.log',
        '**/test-results/**',
        '**/playwright-report/**',
      ],
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_ISO__: JSON.stringify(buildIsoUtc),
    __COMMIT_HASH__: JSON.stringify(commitHash),
  },
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
