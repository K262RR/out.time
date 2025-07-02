import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { employeeService } from '../services/employeeService';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import EmployeeListSkeleton from '../components/ui/EmployeeListSkeleton';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [employeeName, setEmployeeName] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [expiresAt, setExpiresAt] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Загрузка списка сотрудников
  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      const data = await employeeService.getEmployees();
      setEmployees(data.employees);
    } catch (error) {
      toast.error('Не удалось загрузить список сотрудников');
    }
  };

  // Создание приглашения
  const handleInvite = async (e) => {
    e.preventDefault();
    if (!employeeName.trim()) {
      toast.error('Введите имя сотрудника');
      return;
    }

    setIsLoading(true);
    try {
      const { inviteLink, expiresAt } = await employeeService.createInvite(employeeName.trim());
      setInviteLink(inviteLink);
      setExpiresAt(expiresAt);
      toast.success('Приглашение создано');
      loadEmployees();
    } catch (error) {
      toast.error('Не удалось создать приглашение');
    } finally {
      setIsLoading(false);
    }
  };

  // Копирование ссылки
  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    toast.success('Ссылка скопирована');
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEmployeeName('');
    setInviteLink('');
    setExpiresAt(null);
  }

  const StatusBadge = ({ status }) => {
    const statusStyles = {
      work: { text: 'Работает', color: '#51BE3F', bgColor: '#d4ffe3' },
      late: { text: 'Опоздал', color: '#FF9500', bgColor: '#fff4e6' },
      sick: { text: 'Болеет', color: '#FF6C59', bgColor: '#ffe9e6' },
      vacation: { text: 'Отпуск', color: '#5D8FF4', bgColor: '#e6eeff' },
      other: { text: 'Отсутствует', color: '#727272', bgColor: '#f1f1f1' },
      not_started: { text: 'Не начал', color: '#727272', bgColor: '#f1f1f1' },
      default: { text: 'Не активен', color: '#727272', bgColor: '#f1f1f1' },
    };
    const currentStatus = statusStyles[status] || statusStyles.default;

    return (
      <span 
        style={{ color: currentStatus.color, backgroundColor: currentStatus.bgColor }} 
        className="px-[10px] py-[4px] rounded-full text-[12px] font-medium"
        title={`Статус: ${currentStatus.text}`}
      >
        {currentStatus.text}
      </span>
    )
  }

  return (
    <div className="bg-[rgba(255,255,255,0.6)] rounded-[19px] p-3 sm:p-[13px] h-full flex flex-col">
      <div className="mb-[30px] flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-semibold text-gray-900 leading-[32px]">Сотрудники</h1>
          <p className="text-[14px] text-[#727272]">Управление сотрудниками компании</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-[16px] py-[10px] bg-[#101010] text-white text-[14px] font-semibold rounded-[30px] hover:bg-gray-800 transition-colors"
        >
          + Пригласить сотрудника
        </button>
      </div>

      <div className="flex-grow overflow-x-auto">
        {isLoading ? (
          <EmployeeListSkeleton />
        ) : employees.length > 0 ? (
          <div className="min-w-[700px]">
            <div className="grid grid-cols-4 gap-[22px] px-[22px] py-[10px] text-[12px] text-[#727272] font-semibold uppercase">
                <div>Имя</div>
                <div>Статус</div>
                <div>Время работы</div>
                <div>Действия</div>
            </div>
            <div className="flex flex-col gap-2">
              {employees.map((employee) => (
                <div key={employee.id} className="bg-[#f8f8f8] rounded-[16px] p-4 grid grid-cols-4 gap-4 items-center text-sm font-medium">
                  <div className="text-[14px] font-medium text-black">{employee.name}</div>
                  <div><StatusBadge status={employee.todayStatus} /></div>
                  <div className="text-[14px] text-[#727272]">
                    {employee.todayStartTime ? 
                      `${format(new Date(employee.todayStartTime), 'HH:mm')} - ${employee.todayEndTime ? format(new Date(employee.todayEndTime), 'HH:mm') : 'сейчас'}`
                      : '-'}
                  </div>
                  <div>
                    <Link
                      to={`/employees/${employee.id}`}
                      className="text-[14px] text-black hover:underline font-medium"
                    >
                      Подробнее
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-[#f8f8f8] rounded-[16px] p-10 text-center text-gray-500 flex flex-col items-center justify-center h-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21v-1a6 6 0 00-1.78-4.125M15 15h6m-3-3v6" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-800">Список сотрудников пуст</h3>
            <p className="mt-1 text-sm">
              Начните работу, пригласив вашего первого сотрудника.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-6 px-[16px] py-[10px] bg-[#101010] text-white text-[14px] font-semibold rounded-[30px] hover:bg-gray-800 transition-colors"
            >
              + Пригласить сотрудника
            </button>
          </div>
        )}
      </div>

      {/* Модальное окно приглашения */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-[19px] p-[22px] w-full max-w-md">
            <h2 className="text-[20px] font-semibold mb-[20px]">Пригласить сотрудника</h2>
            
            {!inviteLink ? (
              <form onSubmit={handleInvite}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Имя сотрудника
                  </label>
                  <input
                    type="text"
                    value={employeeName}
                    onChange={(e) => setEmployeeName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-[16px] focus:outline-none focus:ring-2 focus:ring-accent"
                    placeholder="Введите имя"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-600 hover:text-gray-800">
                    Отмена
                  </button>
                  <button type="submit" disabled={isLoading} className="px-4 py-2 bg-[#101010] text-white rounded-[16px] hover:bg-gray-800 disabled:opacity-50">
                    {isLoading ? 'Создание...' : 'Создать приглашение'}
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <p className="mb-2 text-sm text-gray-600">
                  Отправьте эту ссылку сотруднику:
                </p>
                <div className="flex items-center space-x-2 mb-2">
                  <input
                    type="text"
                    value={inviteLink}
                    readOnly
                    className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-[16px]"
                  />
                  <button onClick={copyInviteLink} className="p-2 bg-gray-200 rounded-[16px] hover:bg-gray-300">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                  </button>
                </div>
                {expiresAt && (
                  <p className="text-xs text-gray-500 mb-4">
                    Ссылка действительна до: {format(new Date(expiresAt), 'dd.MM.yyyy HH:mm')}
                  </p>
                )}
                <div className="flex justify-end">
                  <button onClick={closeModal} className="px-4 py-2 text-gray-600 hover:text-gray-800">
                    Закрыть
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees; 