import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import Logo from '/LogoText.svg'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await login(formData.email, formData.password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка при входе в систему')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6">
      <div className="max-w-md w-full space-y-8 p-8 bg-white shadow-lg rounded-xl">
        <div className="text-center">
          <img 
            className="mx-auto h-12 w-auto" 
            src={Logo} 
            alt="Out Time" 
          />
          <h2 className="mt-6 text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            Вход в систему
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Учет рабочего времени и отчеты
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="input-field rounded-t-lg"
                placeholder="Email"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Пароль</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="input-field rounded-b-lg"
                placeholder="Пароль"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    {error}
                  </h3>
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={`btn-primary w-full ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
            >
              {isLoading ? 'Вход...' : 'Войти'}
            </button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">
                Нет аккаунта?
              </span>
            </div>
          </div>

          <div className="mt-6">
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="btn-secondary w-full"
            >
              Зарегистрировать компанию
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 