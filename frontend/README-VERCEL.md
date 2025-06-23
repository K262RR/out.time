# 🚀 OutTime Frontend - Vercel Deploy

Фронтенд приложения для учета рабочего времени

## 🔧 Быстрый деплой на Vercel

1. **Форкните/клонируйте репозиторий**
2. **Зайдите на vercel.com** и подключите GitHub
3. **Import проект** с настройками:
   - Root Directory: `frontend`
   - Framework: Vite (автоматически)
   - Build Command: `npm run build`
   - Output Directory: `dist`

4. **Environment Variables:**
   ```
   VITE_API_URL = https://outtime-backend.onrender.com/api
   ```

5. **Deploy!** 🎉

## 🛠️ Локальная разработка

```bash
cd frontend
npm install
npm run dev
```

## 📋 Структура проекта

```
frontend/
├── src/
│   ├── components/     # React компоненты
│   ├── pages/         # Страницы
│   ├── services/      # API сервисы
│   └── context/       # React контекст
├── public/           # Статические файлы
├── dist/            # Собранные файлы
└── vercel.json      # Конфигурация Vercel
```

## 🔗 Backend

Backend API размещен на Render.com:
- Health: https://outtime-backend.onrender.com/health
- API: https://outtime-backend.onrender.com/api
- Docs: https://outtime-backend.onrender.com/api-docs

## ⚙️ Технологии

- React 18
- Vite 5
- React Router
- Tailwind CSS
- Axios
- React Hot Toast 