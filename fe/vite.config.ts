import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import {viteStaticCopy} from 'vite-plugin-static-copy';
// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(),
      viteStaticCopy({
        targets: [
          { src: '*.jpg', dest: '' },
          { src: 'src/data.json', dest: 'assets'}
        ]
      })
    ],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    server: {
      host: true,
      port: 3007,
      proxy: {
        '/groups': {
          target: `http://localhost:${env.VITE_API_PORT}`,
          changeOrigin: true,
        },
        '/links': {
          target: `http://localhost:${env.VITE_API_PORT}`,
          changeOrigin: true,
        }
        ,
        '/configurations': {
          target: `http://localhost:${env.VITE_API_PORT}`,
          changeOrigin: true,
        }
        ,
        '/uploads': {
          target: `http://localhost:${env.VITE_API_PORT}`,
          changeOrigin: true,
        }
      }
    }
  }
})
