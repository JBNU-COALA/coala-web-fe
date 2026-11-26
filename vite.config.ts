import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'API_')
  const analyticsEnv = loadEnv(mode, process.cwd(), 'VITE_POSTHOG_')
  const apiProxyTarget = env.API_PROXY_TARGET || 'http://127.0.0.1:8080'

  return {
    plugins: [react()],
    // Only this public URL may enter the browser bundle; proxy targets stay server-side.
    envPrefix: [],
    define: {
      'import.meta.env.API_BASE_URL': JSON.stringify(env.API_BASE_URL || ''),
      'import.meta.env.VITE_POSTHOG_PROJECT_TOKEN': JSON.stringify(analyticsEnv.VITE_POSTHOG_PROJECT_TOKEN || analyticsEnv.VITE_POSTHOG_KEY || ''),
      'import.meta.env.VITE_POSTHOG_HOST': JSON.stringify(analyticsEnv.VITE_POSTHOG_HOST || 'https://us.i.posthog.com'),
      'import.meta.env.VITE_POSTHOG_ENABLE_DEV': JSON.stringify(analyticsEnv.VITE_POSTHOG_ENABLE_DEV || 'false'),
      'import.meta.env.VITE_POSTHOG_DASHBOARD_EMBED_URL': JSON.stringify(analyticsEnv.VITE_POSTHOG_DASHBOARD_EMBED_URL || 'https://us.posthog.com/embedded/DWxTSGOhilDTefJOxPLvZWAy-vfhxg'),
    },
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
        },
        '/media': {
          target: apiProxyTarget,
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: 'build',
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (
              id.includes('node_modules/@tiptap') ||
              id.includes('node_modules/prosemirror') ||
              id.includes('node_modules/turndown')
            ) {
              return 'vendor-editor'
            }
            if (
              id.includes('node_modules/react') ||
              id.includes('node_modules/react-dom') ||
              id.includes('node_modules/react-router')
            ) {
              return 'vendor-react'
            }
          },
        },
      },
    },
  }
})
