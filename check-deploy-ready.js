#!/usr/bin/env node

// Скрипт проверки готовности к деплою на Render.com
const fs = require('fs');
const path = require('path');

console.log('🔍 Проверка готовности к деплою...\n');

let allChecks = true;

// Проверяем структуру проекта
const requiredFiles = [
  'package.json',
  'backend/package.json',
  'frontend/package.json',
  'backend/server.js',
  'frontend/src/main.jsx',
  'backend/src/config/database.js',
  'backend/migrations/001_initial_schema.sql'
];

console.log('📁 Проверка файлов:');
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - ОТСУТСТВУЕТ`);
    allChecks = false;
  }
});

// Проверяем package.json backend
console.log('\n🔧 Проверка backend package.json:');
try {
  const backendPkg = JSON.parse(fs.readFileSync('backend/package.json', 'utf8'));

  // Проверяем необходимые скрипты
  const requiredScripts = ['start', 'build', 'postinstall'];
  requiredScripts.forEach(script => {
    if (backendPkg.scripts && backendPkg.scripts[script]) {
      console.log(`  ✅ script: ${script}`);
    } else {
      console.log(`  ❌ script: ${script} - ОТСУТСТВУЕТ`);
      allChecks = false;
    }
  });

  // Проверяем зависимости
  const requiredDeps = ['express', 'pg', 'cors', 'dotenv'];
  requiredDeps.forEach(dep => {
    if (backendPkg.dependencies && backendPkg.dependencies[dep]) {
      console.log(`  ✅ dependency: ${dep}`);
    } else {
      console.log(`  ❌ dependency: ${dep} - ОТСУТСТВУЕТ`);
      allChecks = false;
    }
  });
} catch (error) {
  console.log(`  ❌ Ошибка чтения backend/package.json: ${error.message}`);
  allChecks = false;
}

// Проверяем package.json frontend
console.log('\n🎨 Проверка frontend package.json:');
try {
  const frontendPkg = JSON.parse(fs.readFileSync('frontend/package.json', 'utf8'));

  // Проверяем необходимые скрипты
  const requiredScripts = ['build', 'preview'];
  requiredScripts.forEach(script => {
    if (frontendPkg.scripts && frontendPkg.scripts[script]) {
      console.log(`  ✅ script: ${script}`);
    } else {
      console.log(`  ❌ script: ${script} - ОТСУТСТВУЕТ`);
      allChecks = false;
    }
  });

  // Проверяем зависимости
  const requiredDeps = ['react', 'react-dom'];
  requiredDeps.forEach(dep => {
    if (frontendPkg.dependencies && frontendPkg.dependencies[dep]) {
      console.log(`  ✅ dependency: ${dep}`);
    } else {
      console.log(`  ❌ dependency: ${dep} - ОТСУТСТВУЕТ`);
      allChecks = false;
    }
  });
} catch (error) {
  console.log(`  ❌ Ошибка чтения frontend/package.json: ${error.message}`);
  allChecks = false;
}

// Проверяем API конфигурацию
console.log('\n🌐 Проверка API конфигурации:');
try {
  const apiConfig = fs.readFileSync('frontend/src/services/api.js', 'utf8');
  if (apiConfig.includes('VITE_API_URL')) {
    console.log('  ✅ API URL конфигурация настроена');
  } else {
    console.log('  ❌ API URL конфигурация не найдена');
    allChecks = false;
  }
} catch (error) {
  console.log(`  ❌ Ошибка проверки API конфигурации: ${error.message}`);
  allChecks = false;
}

// Проверяем webhook для бота
console.log('\n🤖 Проверка Telegram бота:');
try {
  const botRoutes = fs.readFileSync('backend/src/routes/bot.js', 'utf8');
  if (botRoutes.includes('/webhook')) {
    console.log('  ✅ Webhook маршрут настроен');
  } else {
    console.log('  ❌ Webhook маршрут не найден');
    allChecks = false;
  }
} catch (error) {
  console.log(`  ❌ Ошибка проверки bot routes: ${error.message}`);
  allChecks = false;
}

// Итоговый результат
console.log('\n' + '='.repeat(50));
if (allChecks) {
  console.log('✅ ВСЕ ПРОВЕРКИ ПРОЙДЕНЫ!');
  console.log('🚀 Проект готов к деплою на Render.com');
  console.log('\n📖 Следующие шаги:');
  console.log('1. Загрузите код в GitHub репозиторий');
  console.log('2. Следуйте инструкциям в RENDER_DEPLOY.md');
  console.log('3. Создайте сервисы в Render Dashboard');
} else {
  console.log('❌ ЕСТЬ ПРОБЛЕМЫ!');
  console.log('🛠️  Исправьте указанные ошибки перед деплоем');
  process.exit(1);
} 