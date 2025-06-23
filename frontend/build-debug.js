import { build } from 'vite'
import react from '@vitejs/plugin-react'

console.log('🔧 Запуск отладочной сборки...')

try {
  await build({
    plugins: [react()],
    build: {
      outDir: 'dist',
      sourcemap: false,
      minify: false, // Отключаем минификацию для отладки
      rollupOptions: {
        output: {
          manualChunks: undefined,
        },
      },
    },
    define: {
      global: 'globalThis',
    },
  })

  console.log('✅ Сборка успешна!')
} catch (error) {
  console.error('❌ Ошибка сборки:', error)
  process.exit(1)
} 