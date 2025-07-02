import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

import useAuth from './hooks/useAuth'

import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import Employees from './pages/Employees'
import EmployeeDetail from './pages/EmployeeDetail'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import Login from './pages/Login'
import Register from './pages/Register'
import Help from './pages/Help'
import Faq from './pages/Faq'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div>Загрузка...</div>
  return user ? children : <Navigate to="/login" />
}

function App() {
  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Private routes */}
        <Route 
          path="/*" 
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="employees" element={<Employees />} />
          <Route path="employees/:id" element={<EmployeeDetail />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          <Route path="faq" element={<Faq />} />
          <Route path="help" element={<Help />} />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Route>
      </Routes>
    </>
  )
}

export default App 