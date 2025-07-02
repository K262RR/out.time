import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { employeeService } from '../services/employeeService'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'

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
    <span style={{ color: currentStatus.color, backgroundColor: currentStatus.bgColor }} className="px-[10px] py-[4px] rounded-full text-[12px] font-medium">
      {currentStatus.text}
    </span>
  )
};

const InfoCard = ({ title, children }) => (
  <div className="bg-[#f8f8f8] rounded-[16px] p-[22px]">
    <h3 className="text-[18px] font-semibold text-gray-900 mb-4">{title}</h3>
    <div className="space-y-3 text-[14px]">
      {children}
    </div>
  </div>
);

const EmployeeDetail = () => {
  const { id } = useParams()
  const [employee, setEmployee] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadEmployeeDetails()
  }, [id])

  const loadEmployeeDetails = async () => {
    try {
      setLoading(true)
      const data = await employeeService.getEmployee(id)
      setEmployee(data) // Сохраняем весь объект data вместо только employee
    } catch (error) {
      toast.error(error.response?.data?.error || 'Не удалось загрузить данные сотрудника')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    )
  }

  if (!employee) {
    return (
      <div className="bg-[rgba(255,255,255,0.6)] rounded-[19px] p-[13px] text-center text-[#727272]">
        Сотрудник не найден.
      </div>
    )
  }

  const InfoRow = ({ label, value }) => (
    <div>
      <span className="text-gray-500">{label}:</span>
      <span className="ml-2 font-medium text-gray-800">{value}</span>
    </div>
  )

  return (
    <div className="flex flex-col gap-[23px]">
      <div className="bg-[rgba(255,255,255,0.6)] rounded-[19px] p-[13px]">
        <div className="mb-6">
          <h1 className="text-[24px] font-semibold text-gray-900 leading-[32px]">{employee.employee?.name}</h1>
          <p className="text-[14px] text-[#727272]">Подробная информация о сотруднике</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[3px]">
          <InfoCard title="Основная информация">
            <InfoRow label="Текущий статус" value={<StatusBadge status={employee.today?.timeRecord?.status || 'default'} />} />
            <InfoRow label="Дата регистрации" value={format(new Date(employee.employee?.createdAt), 'dd.MM.yyyy')} />
            {employee.employee?.telegramId && <InfoRow label="Telegram ID" value={employee.employee?.telegramId} />}
            <InfoRow label="Активен" value={employee.employee?.isActive ? 'Да' : 'Нет'} />
          </InfoCard>

          <InfoCard title="Статистика за неделю">
            <InfoRow label="Рабочих дней" value={employee.weekStats?.workingDays || 0} />
            <InfoRow label="Отработано часов" value={employee.weekStats?.totalHours || '0ч 0мин'} />
            <InfoRow label="Отчетов за неделю" value={employee.weekStats?.reportsCount || 0} />
          </InfoCard>
          
          <InfoCard title="Сегодня">
            {employee.today?.timeRecord ? (
              <>
                <InfoRow label="Статус" value={<StatusBadge status={employee.today.timeRecord.status} />} />
                <InfoRow label="Начало работы" value={format(new Date(employee.today.timeRecord.startTime), 'HH:mm')} />
                {employee.today.timeRecord.endTime ? (
                  <>
                    <InfoRow label="Окончание работы" value={format(new Date(employee.today.timeRecord.endTime), 'HH:mm')} />
                    <InfoRow label="Отработано" value={employee.today.timeRecord.workDuration} />
                  </>
                ) : (
                  <InfoRow label="Статус" value="Еще работает" />
                )}
                {employee.today.report && (
                  <InfoRow label="Отчет сдан" value="✅ Да" />
                )}
              </>
            ) : (
              <p className="text-gray-500">Сегодня еще не приступал к работе</p>
            )}
          </InfoCard>
        </div>
      </div>

      {/* Отчет за сегодня */}
      {employee.today?.report && (
        <div className="bg-[rgba(255,255,255,0.6)] rounded-[19px] p-[13px]">
          <h3 className="text-[20px] font-semibold text-gray-900 mb-[20px]">Отчет за сегодня</h3>
          <div className="bg-[#f8f8f8] rounded-[16px] p-[22px]">
            <div className="flex justify-between items-start mb-2">
              <p className="text-gray-900 whitespace-pre-wrap flex-1">{employee.today.report.content}</p>
              <div className="text-right ml-4">
                <span className="text-sm text-gray-500 block">Сегодня</span>
                <span className="text-xs text-gray-400 block">{format(new Date(employee.today.report.createdAt), 'HH:mm')}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-[rgba(255,255,255,0.6)] rounded-[19px] p-[13px]">
        <h3 className="text-[20px] font-semibold text-gray-900 mb-[20px]">История отчетов</h3>
        <div className="flex flex-col gap-[3px]">
          {employee.recentReports?.length > 0 ? (
            employee.recentReports.map(report => (
              <div key={report.id} className="bg-[#f8f8f8] rounded-[16px] p-[22px]">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-gray-900 whitespace-pre-wrap flex-1">{report.content}</p>
                  <div className="text-right ml-4">
                    <span className="text-sm text-gray-500 block">{format(new Date(report.date), 'dd.MM.yyyy')}</span>
                    <span className="text-xs text-gray-400 block">{format(new Date(report.createdAt), 'HH:mm:ss')}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-[#f8f8f8] rounded-[16px] p-[22px] text-center text-[#727272]">
              <p>Нет отчетов</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default EmployeeDetail 