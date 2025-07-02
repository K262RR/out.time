import React from 'react'
import { Outlet } from 'react-router-dom'
import Header from './Header'
import Sidebar from './Sidebar'

const Layout = () => {
  return (
    <div className="flex h-screen bg-gray-50 p-[10px] gap-[23px]">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main content */}
      <div className="flex flex-col flex-1 ml-[0px]">
        <Header />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout 