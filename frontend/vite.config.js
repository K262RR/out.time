import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@pages': resolve(__dirname, 'src/pages'),
      '@services': resolve(__dirname, 'src/services'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@hooks': resolve(__dirname, 'src/hooks'),
    }
  },
  css: {
    postcss: {
      plugins: [
        tailwindcss,
        autoprefixer,
      ],
    },
    // Оптимизация CSS
    devSourcemap: true,
  },
  server: {
    port: 5173,
    host: true,
    // Оптимизация dev сервера
    hmr: {
      overlay: false
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist',
    // Оптимизация сборки
    target: 'es2015',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: process.env.NODE_ENV === 'production',
      },
    },
    rollupOptions: {
      output: {
        // Разделение кода на чанки для лучшего кеширования
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['react-hot-toast', 'react-toastify', 'lucide-react'],
          utils: ['axios', 'date-fns'],
        },
        // Оптимизация имен файлов
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      },
    },
    // Увеличиваем лимит для больших чанков
    chunkSizeWarningLimit: 1000,
    // Sourcemaps только для development
    sourcemap: process.env.NODE_ENV === 'development',
    // Оптимизация ассетов
    assetsInlineLimit: 4096,
  },
  // Оптимизация зависимостей
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react-router-dom', 
      'axios', 
      'date-fns',
      'react-hot-toast'
    ],
    exclude: ['@vite/client', '@vite/env']
  },
  // Предварительная сборка зависимостей
  esbuild: {
    // Удаляем console.log в продакшене
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
    // Оптимизация JSX
    jsx: 'automatic',
  }
}) 