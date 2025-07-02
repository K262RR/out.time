import axios from 'axios'

// Простой кеш для GET запросов
class ApiCache {
  constructor() {
    this.cache = new Map()
    this.ttl = 5 * 60 * 1000 // 5 минут TTL по умолчанию
  }

  get(key) {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      return cached.data
    }
    this.cache.delete(key)
    return null
  }

  set(key, data, customTtl = null) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: customTtl || this.ttl
    })
  }

  clear() {
    this.cache.clear()
  }

  delete(pattern) {
    // Удаляем записи по паттерну (например, все записи содержащие 'dashboard')
    for (const [key] of this.cache) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    }
  }
}

const apiCache = new ApiCache()

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000 // 10 секунд timeout
})

// Добавляем токен к каждому запросу
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // Добавляем кеширование для GET запросов
    if (config.method === 'get') {
      const cacheKey = `${config.url}${config.params ? JSON.stringify(config.params) : ''}`
      const cachedData = apiCache.get(cacheKey)
      
      if (cachedData) {
        // Возвращаем промис с кешированными данными
        config.__cachedResponse = Promise.resolve({
          data: cachedData,
          status: 200,
          statusText: 'OK (cached)',
          headers: {},
          config
        })
      }
      
      config.__cacheKey = cacheKey
    }

    return config
  },
  error => Promise.reject(error)
)

// Перехватчик для обработки ответов и кеширования
api.interceptors.response.use(
  response => {
    // Кешируем успешные GET запросы
    if (response.config.method === 'get' && response.status === 200) {
      const cacheKey = response.config.__cacheKey
      if (cacheKey) {
        // Определяем TTL в зависимости от типа данных
        let ttl = 5 * 60 * 1000 // 5 минут по умолчанию
        
        if (cacheKey.includes('dashboard')) {
          ttl = 2 * 60 * 1000 // 2 минуты для дашборда
        } else if (cacheKey.includes('employees')) {
          ttl = 10 * 60 * 1000 // 10 минут для списка сотрудников
        } else if (cacheKey.includes('settings')) {
          ttl = 30 * 60 * 1000 // 30 минут для настроек
        }
        
        apiCache.set(cacheKey, response.data, ttl)
      }
    }

    // Очищаем кеш при изменении данных
    if (['post', 'put', 'patch', 'delete'].includes(response.config.method)) {
      // Очищаем кеш для связанных данных
      if (response.config.url.includes('employees')) {
        apiCache.delete('employees')
        apiCache.delete('dashboard')
      } else if (response.config.url.includes('reports')) {
        apiCache.delete('reports')
        apiCache.delete('dashboard')
      } else if (response.config.url.includes('settings')) {
        apiCache.delete('settings')
      }
    }

    return response
  },
  async error => {
    // Retry механизм для сетевых ошибок
    const config = error.config
    if (!config.__retryCount) {
      config.__retryCount = 0
    }

    const shouldRetry = config.__retryCount < 3 && 
                       (error.code === 'NETWORK_ERROR' || 
                        error.code === 'ECONNABORTED' ||
                        (error.response && error.response.status >= 500))

    if (shouldRetry) {
      config.__retryCount++
      // Экспоненциальная задержка: 1s, 2s, 4s
      const delay = Math.pow(2, config.__retryCount - 1) * 1000
      await new Promise(resolve => setTimeout(resolve, delay))
      return api(config)
    }

    // Обработка ошибок аутентификации
    if (error.response?.status === 401) {
      apiCache.clear() // Очищаем кеш при разлогине
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    
    // Добавляем обработку 404 ошибки
    if (error.response?.status === 404) {
      console.error('Ресурс не найден:', error.response.data)
    }
    
    return Promise.reject(error)
  }
)

// Перехватчик для обработки кешированных ответов
api.interceptors.request.use(
  config => {
    if (config.__cachedResponse) {
      return config.__cachedResponse.then(response => {
        return Promise.reject({ 
          response, 
          __isCached: true 
        })
      })
    }
    return config
  }
)

// Обработка кешированных ответов
const originalRequest = api.request
api.request = function(config) {
  return originalRequest.call(this, config).catch(error => {
    if (error.__isCached) {
      return Promise.resolve(error.response)
    }
    return Promise.reject(error)
  })
}

// Экспортируем утилиты для работы с кешем
export const clearApiCache = () => apiCache.clear()
export const clearCachePattern = (pattern) => apiCache.delete(pattern)

export default api 