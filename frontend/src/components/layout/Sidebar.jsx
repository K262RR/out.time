import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'

// Иконка для Дашборда
const DashboardIcon = ({ isActive }) => (
  <svg className="w-[24px] h-[24px]" fill="none" viewBox="0 0 20 20">
    <path
      d="M1 4.6C1 2.61 2.61004 1 4.60004 1C6.59004 1 8.20001 2.61 8.20001 4.6C8.20001 6.59 6.59004 8.2 4.60004 8.2C2.62004 8.2 1 6.59 1 4.6ZM15.4 8.2C17.39 8.2 19 6.59 19 4.6C19 2.61 17.39 1 15.4 1C13.41 1 11.8 2.61 11.8 4.6C11.8 6.59 13.42 8.2 15.4 8.2ZM4.60004 19C6.59004 19 8.20001 17.39 8.20001 15.4C8.20001 13.41 6.59004 11.8 4.60004 11.8C2.61004 11.8 1 13.41 1 15.4C1 17.39 2.62004 19 4.60004 19ZM15.4 19C17.39 19 19 17.39 19 15.4C19 13.41 17.39 11.8 15.4 11.8C13.41 11.8 11.8 13.41 11.8 15.4C11.8 17.39 13.42 19 15.4 19Z"
      className={`transition-all duration-200 ${isActive ? 'stroke-gray-900' : 'stroke-gray-500'}`}
      strokeWidth="1.5"
    />
  </svg>
);

// Иконка для Сотрудников
const EmployeesIcon = ({ isActive }) => (
  <svg className="w-[24px] h-[24px]" fill="none" viewBox="0 0 24 24">
    <circle cx="12" cy="7" r="4" className={`transition-all duration-200 ${isActive ? 'stroke-gray-900' : 'stroke-gray-500'}`} strokeWidth="1.5" />
    <path d="M4 21V20C4 16.6863 6.68629 14 10 14H14C17.3137 14 20 16.6863 20 20V21" className={`transition-all duration-200 ${isActive ? 'stroke-gray-900' : 'stroke-gray-500'}`} strokeWidth="1.5" />
  </svg>
);

// Иконка для Отчетов
const ReportsIcon = ({ isActive }) => (
  <svg className="w-[24px] h-[24px]" fill="none" viewBox="0 0 24 24">
    <path d="M3 8.5C3 6.567 4.567 5 6.5 5H17.5C19.433 5 21 6.567 21 8.5V15.5C21 17.433 19.433 19 17.5 19H6.5C4.567 19 3 17.433 3 15.5V8.5Z" className={`transition-all duration-200 ${isActive ? 'stroke-gray-900' : 'stroke-gray-500'}`} strokeWidth="1.5" />
    <path d="M3.5 15.5L6.82708 13.6516C7.53658 13.2575 8.41396 13.3312 9.04775 13.8382L9.39792 14.1183C10.0587 14.6469 10.9776 14.7044 11.697 14.259C13.7451 12.9911 17.9914 10.3625 21 8.5" className={`transition-all duration-200 ${isActive ? 'stroke-gray-900' : 'stroke-gray-500'}`} strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// Иконка для Настроек (используем иконку отчетов, т.к. в макете нет отдельной)
const SettingsIcon = ReportsIcon;

// Иконка для Сообщений внизу
const MessageIcon = () => (
    <svg className="w-[24px] h-[24px]" fill="none" viewBox="0 0 18 17">
        <path d="M8.91885 1C4.54527 1 1 4.19051 1 8.12697C1 9.58641 1.48939 10.9429 2.32641 12.0729L1.35714 15.6887L5.54384 14.5666C6.56854 15.0029 7.70964 15.2539 8.91885 15.2539C13.2924 15.2539 16.8377 12.0634 16.8377 8.12697C16.8377 4.19051 13.2924 1 8.91885 1Z" stroke="#727272" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

// Иконка Луны для переключателя темы
const MoonIcon = () => (
    <svg className="w-[16px] h-[16px]" fill="none" viewBox="0 0 14 14">
        <path d="M12.9759 7.49015C12.2241 8.0083 11.3128 8.31168 10.3307 8.31168C7.7534 8.31168 5.66406 6.22235 5.66406 3.64502C5.66406 2.66296 5.96741 1.75176 6.48551 1C3.41274 1.26036 1 3.83697 1 6.9771C1 10.2901 3.68573 12.9759 6.99875 12.9759C10.139 12.9759 12.7156 10.563 12.9759 7.49015Z" stroke="#727272" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

// Иконка Солнца для переключателя темы
const SunIcon = () => (
    <svg className="w-[16px] h-[16px]" fill="none" viewBox="0 0 16 16">
        <path d="M8.0001 2.19389V1.17839M3.89454 12.1057L3.17647 12.8238M8.0001 14.8218V13.8063M12.8235 3.17645L12.1055 3.89452M13.806 8.00009H14.8215M12.1055 12.1057L12.8235 12.8238M1.17839 8.00009H2.19389M3.17641 3.17641L3.89448 3.89448M10.4749 5.52521C11.8417 6.89204 11.8417 9.10812 10.4749 10.475C9.10804 11.8418 6.89196 11.8418 5.52513 10.475C4.15829 9.10812 4.15829 6.89204 5.52513 5.52521C6.89196 4.15837 9.10804 4.15837 10.4749 5.52521Z" stroke="#101010" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const Sidebar = () => {
  const location = useLocation()
  
  const navItems = [
    { name: 'Дашборд', href: '/dashboard', icon: DashboardIcon },
    { name: 'Сотрудники', href: '/employees', icon: EmployeesIcon },
    { name: 'Отчеты', href: '/reports', icon: ReportsIcon },
  ]

  return (
    <aside className="bg-white rounded-[19px] w-[271px] p-[13px] flex flex-col flex-shrink-0">
      <div className="flex-grow">
        <div className="flex items-center mb-[30px]">
          <img src="/Logo.svg" alt="Out Time Logo" className="w-[48px] h-[48px]" />
          <img src="/LogoText.svg" alt="Out Time" className="ml-[12px]" />
        </div>
        <nav>
        <ul className="space-y-[4px] pl-0">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.href)
            const ItemIcon = item.icon
            return (
              <li key={item.name}>
                <NavLink
                  to={item.href}
                  className={`
                    flex items-center px-[12px] py-[12px] rounded-[16px] text-[14px] font-semibold transition-colors duration-200
                    ${isActive
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-500 hover:bg-gray-100'
                    }
                  `}
                >
                  <span className="mr-[12px]">
                    <ItemIcon isActive={isActive} />
                  </span>
                  {item.name}
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>
      </div>
      

      <div className="p-3">
        <NavLink
          to="/help"
          className={({ isActive }) =>
            `block mb-2 text-sm hover:text-black transition-colors ${
              isActive ? 'font-semibold text-black' : 'text-gray-600'
            }`
          }
        >
          Помощь
        </NavLink>
        <NavLink
          to="/faq"
          className={({ isActive }) =>
            `block text-sm hover:text-black transition-colors ${
              isActive ? 'font-semibold text-black' : 'text-gray-600'
            }`
          }
        >
          Часто задаваемые вопросы
        </NavLink>
      </div>
    </aside>
  )
}

export default Sidebar 