// Утилиты для оптимизации производительности

import React, { useRef, useCallback, useMemo, useEffect, useState } from 'react';

/**
 * Дебаунс функция для предотвращения частых вызовов
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Тротлинг функция для ограничения частоты вызовов
 */
export const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * React хук для дебаунса
 */
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * React хук для тротлинга
 */
export const useThrottle = (value, limit) => {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastRan = useRef(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, limit - (Date.now() - lastRan.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);

  return throttledValue;
};

/**
 * Мемоизация для тяжелых вычислений
 */
export const memoize = (fn) => {
  const cache = new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
};

/**
 * Хук для мемоизированных вычислений
 */
export const useMemoizedCallback = (callback, deps) => {
  return useCallback(callback, deps);
};

/**
 * Хук для ленивой инициализации состояния
 */
export const useLazyState = (initializer) => {
  return useState(() => {
    return typeof initializer === 'function' ? initializer() : initializer;
  });
};

/**
 * Intersection Observer хук для ленивой загрузки
 */
export const useIntersectionObserver = (elementRef, options = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [elementRef, options]);

  return isIntersecting;
};

/**
 * Хук для отслеживания размеров окна с дебаунсом
 */
export const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: undefined,
    height: undefined,
  });

  useEffect(() => {
    const handleResize = debounce(() => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }, 250);

    window.addEventListener('resize', handleResize);
    handleResize(); // Set initial size

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
};

/**
 * Хук для ленивой загрузки изображений
 */
export const useLazyImage = (src, placeholder = null) => {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef(null);
  const isIntersecting = useIntersectionObserver(imgRef, {
    threshold: 0.1,
    rootMargin: '50px'
  });

  useEffect(() => {
    if (isIntersecting && src && !isLoaded) {
      const img = new Image();
      img.onload = () => {
        setImageSrc(src);
        setIsLoaded(true);
      };
      img.src = src;
    }
  }, [isIntersecting, src, isLoaded]);

  return { imageSrc, imgRef, isLoaded };
};

/**
 * Простой кеш для компонентов
 */
class ComponentCache {
  constructor(maxSize = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key) {
    if (this.cache.has(key)) {
      const value = this.cache.get(key);
      // Перемещаем в конец (LRU)
      this.cache.delete(key);
      this.cache.set(key, value);
      return value;
    }
    return null;
  }

  set(key, value) {
    if (this.cache.size >= this.maxSize) {
      // Удаляем самый старый элемент
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  clear() {
    this.cache.clear();
  }
}

export const componentCache = new ComponentCache();

/**
 * Хук для кеширования компонентов
 */
export const useCachedComponent = (key, component, deps = []) => {
  return useMemo(() => {
    const cachedComponent = componentCache.get(key);
    if (cachedComponent) {
      return cachedComponent;
    }

    const newComponent = component();
    componentCache.set(key, newComponent);
    return newComponent;
  }, deps);
};

/**
 * Утилита для предзагрузки ресурсов
 */
export const preloadResource = (href, as = 'fetch') => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  document.head.appendChild(link);
};

/**
 * Утилита для предзагрузки изображений
 */
export const preloadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

/**
 * Батчинг обновлений состояния
 */
export const batchUpdates = (callback) => {
  // В React 18 автоматически батчит все обновления
  // Для более старых версий можно использовать unstable_batchedUpdates
  if (typeof React !== 'undefined' && React.unstable_batchedUpdates) {
    React.unstable_batchedUpdates(callback);
  } else {
    callback();
  }
};

/**
 * Хук для отложенной загрузки компонентов
 */
export const useDeferredValue = (value, deferMs = 100) => {
  const [deferredValue, setDeferredValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDeferredValue(value);
    }, deferMs);

    return () => clearTimeout(timer);
  }, [value, deferMs]);

  return deferredValue;
};

export default {
  debounce,
  throttle,
  memoize,
  useDebounce,
  useThrottle,
  useMemoizedCallback,
  useLazyState,
  useIntersectionObserver,
  useWindowSize,
  useLazyImage,
  componentCache,
  useCachedComponent,
  preloadResource,
  preloadImage,
  batchUpdates,
  useDeferredValue
}; 