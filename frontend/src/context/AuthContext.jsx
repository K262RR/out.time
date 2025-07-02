import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react'
import api from '../services/api'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      try {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
        // We can still verify with the server in the background if needed
        // checkAuth(); 
      } catch (error) {
        console.error('Ошибка парсинга данных пользователя:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false)
  }, [])

  const checkAuth = useCallback(async () => {
    // This function can be used to verify the token with the server,
    // but the initial state is now set synchronously from localStorage.
    try {
      const response = await api.get('/auth/me')
      const fetchedUser = response.data.user;
      setUser(fetchedUser)
      localStorage.setItem('user', JSON.stringify(fetchedUser));
      setIsAuthenticated(true)
    } catch (error) {
      logout();
    } finally {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password })
      const { accessToken, user } = response.data
      
      localStorage.setItem('token', accessToken)
      localStorage.setItem('user', JSON.stringify(user));
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
      
      setUser(user)
      setIsAuthenticated(true)
      
      return response.data
    } catch (error) {
      console.error('Login failed:', error.response || error)
      throw error
    }
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization']
    setUser(null)
    setIsAuthenticated(false)
  }, [])

  const register = useCallback(async (companyName, email, password) => {
    try {
      const response = await api.post('/auth/register', {
        companyName,
        email,
        password
      })
      const { accessToken, user } = response.data
      
      localStorage.setItem('token', accessToken)
      localStorage.setItem('user', JSON.stringify(user));
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
      
      setUser(user)
      setIsAuthenticated(true)
      
      return response.data
    } catch (error) {
      console.error('Registration failed:', error.response || error)
      throw error
    }
  }, [])

  const updateUser = useCallback((updatedUserData) => {
    setUser(prevUser => {
      const newUser = { ...prevUser, ...updatedUserData };
      localStorage.setItem('user', JSON.stringify(newUser));
      return newUser;
    });
  }, []);

  const updateUserCompany = useCallback((companyName) => {
    setUser(prevUser => {
      if (prevUser) {
        const updatedUser = { ...prevUser, company: { ...prevUser.company, name: companyName } };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        return updatedUser;
      }
      return prevUser;
    });
  }, []);

  // Мемоизируем value объект для предотвращения ненужных re-renders
  const value = useMemo(() => ({
    isAuthenticated,
    user,
    loading,
    login,
    logout,
    register,
    updateUser,
    updateUserCompany,
    checkAuth
  }), [isAuthenticated, user, loading, login, logout, register, updateUser, updateUserCompany, checkAuth])

  // Мемоизируем loading компонент
  const loadingComponent = useMemo(() => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
    </div>
  ), [])

  // The loading screen is now simpler as we don't need to wait for checkAuth
  if (loading) {
    return loadingComponent
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 