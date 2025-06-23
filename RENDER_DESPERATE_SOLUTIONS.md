# 🆘 Экстренные решения для деплоя фронтенда на Render

Если все предыдущие решения не помогли, попробуйте эти варианты:

## 🎯 Попробуйте сейчас

### Вариант 1: Упрощенный package.json (Текущий)
```yaml
buildCommand: cp package-render.json package.json && npm install && npm run build
```

### Вариант 2: Принудительная установка
```yaml
buildCommand: rm -rf node_modules package-lock.json && npm install && ./node_modules/.bin/vite build
```

### Вариант 3: Использование yarn вместо npm
```yaml
buildCommand: yarn install && yarn build
```

### Вариант 4: Глобальная установка Vite
```yaml
buildCommand: npm install -g vite && npm install && vite build
```

## 🔄 Альтернативные подходы

### Использование GitHub Actions для сборки
1. Создайте `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Render
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: cd frontend && npm install && npm run build
      - run: |
          git config --global user.email "action@github.com"
          git config --global user.name "GitHub Action"
          git add frontend/dist -f
          git commit -m "Build frontend"
          git push
```

### Использование Netlify вместо Render для фронтенда
1. Подключите репозиторий к Netlify
2. Build settings:
   - Base directory: `frontend`
   - Build command: `npm install && npm run build`
   - Publish directory: `dist`

### Использование Vercel
1. Подключите репозиторий к Vercel  
2. Root Directory: `frontend`
3. Build Command: `npm run build`
4. Output Directory: `dist`

## 🛠️ Локальная сборка + коммит dist

Если ничего не работает на CI/CD:

```bash
# Локально
cd frontend
npm install
npm run build

# Добавляем dist в git (обычно в .gitignore)
git add dist -f
git commit -m "Add built frontend"
git push origin main
```

Затем в render.yaml:
```yaml
services:
  - type: web
    name: outtime-frontend
    runtime: static
    rootDir: ./frontend
    buildCommand: echo "Using pre-built files"
    staticPublishPath: ./dist
```

## 📋 Проверочный чек-лист

Попробуйте в таком порядке:

1. ✅ **Упрощенный package.json** (текущий вариант)
2. ⬜ **Принудительная установка** (Вариант 2)
3. ⬜ **Yarn вместо npm** (Вариант 3) 
4. ⬜ **Глобальная установка Vite** (Вариант 4)
5. ⬜ **Netlify/Vercel** вместо Render
6. ⬜ **Локальная сборка + коммит**

## 🆘 Последний резерв

Если ВСЕ варианты не работают, создайте простой HTML файл:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Out Time - Скоро запуск</title>
    <style>
        body { font-family: Arial; text-align: center; padding: 50px; }
        .container { max-width: 600px; margin: 0 auto; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Out Time</h1>
        <p>Система учета рабочего времени</p>
        <p>Сайт находится в разработке</p>
        <p>API доступно по адресу: <a href="/api">/api</a></p>
    </div>
</body>
</html>
```

И используйте его как временное решение.

## 💡 Диагностика

Добавьте в buildCommand для отладки:
```bash
echo "Node version:" && node --version && 
echo "NPM version:" && npm --version && 
echo "Current directory:" && pwd && 
echo "Files:" && ls -la && 
npm install && npm run build
``` 