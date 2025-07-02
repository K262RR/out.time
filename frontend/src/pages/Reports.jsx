import React, { useState, useEffect } from 'react';
import { reportsService } from '../services/reportsService';
import { toast } from 'react-hot-toast';
import { format, formatDistanceToNow, isToday } from 'date-fns';
import { ru } from 'date-fns/locale';
import DatePicker from '../components/ui/DatePicker';
import ReportsSkeleton from '../components/ui/ReportsSkeleton';

const ReportTime = ({ date }) => {
  const reportDate = new Date(date);
  
  if (isToday(reportDate)) {
    return formatDistanceToNow(reportDate, { addSuffix: true, locale: ru });
  }
  
  return format(reportDate, 'dd MMM, HH:mm', { locale: ru });
}

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadReports();
  }, [filters]);

  const loadReports = async () => {
    try {
      setIsLoading(true);
      const data = await reportsService.getReports(filters);
      setReports(data.reports);
    } catch (error) {
      toast.error('Не удалось загрузить отчеты');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const blob = await reportsService.exportReports(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reports_${filters.startDate}_${filters.endDate}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Отчет успешно экспортирован');
    } catch (error) {
      toast.error('Не удалось экспортировать отчеты');
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="bg-[rgba(255,255,255,0.6)] rounded-[19px] p-3 sm:p-[13px] mb-4 sm:mb-[23px]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4">
            <div className="mb-4 sm:mb-0">
                <h1 className="text-xl sm:text-[24px] font-semibold text-gray-900 leading-tight sm:leading-[32px]">Отчеты</h1>
                <p className="text-sm text-[#727272]">Отчеты сотрудников за выбранный период</p>
            </div>
            <button onClick={handleExport} disabled={isLoading || reports.length === 0}
                className="w-full sm:w-auto px-4 py-2 sm:px-[16px] sm:py-[10px] bg-[#101010] text-white text-sm font-semibold rounded-[16px] sm:rounded-[30px] hover:bg-gray-800 transition-colors disabled:opacity-50">
            Экспорт в Excel
            </button>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <DatePicker
            label="Начальная дата"
            name="startDate"
            value={filters.startDate}
            onChange={handleFilterChange}
          />
          <DatePicker
            label="Конечная дата"
            name="endDate"
            value={filters.endDate}
            onChange={handleFilterChange}
          />
        </div>
      </div>

      <div className="bg-[rgba(255,255,255,0.6)] rounded-[19px] p-3 sm:p-[13px] flex-grow overflow-y-auto">
        <h3 className="text-lg sm:text-[20px] font-semibold text-gray-900 mb-4">Все отчеты</h3>
        {isLoading ? (
          <ReportsSkeleton />
        ) : reports.length > 0 ? (
          <div className="overflow-x-auto">
            <div className="min-w-[600px]">
              <div className="hidden md:grid grid-cols-3 gap-4 px-4 py-2 text-xs text-gray-500 font-semibold uppercase">
                  <div>Сотрудник</div>
                  <div>Отчет</div>
                  <div>Дата и время</div>
              </div>
              <div className="flex flex-col gap-2">
                {reports.map((report) => (
                  <div key={report.id} className="bg-[#f8f8f8] rounded-[16px] p-4 text-sm">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-2">
                      <div className="font-semibold text-black">{report.employeeName}</div>
                      <div className="whitespace-normal break-words col-span-1 md:col-span-2 text-gray-700">
                        <span className="md:hidden font-medium text-gray-500">Отчет: </span>
                        {report.content}
                      </div>
                      <div className="col-span-1 text-gray-500 md:text-right">
                        <ReportTime date={report.createdAt} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-[#f8f8f8] rounded-[16px] p-10 text-center text-gray-500 flex flex-col items-center justify-center h-full">
            <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            <h3 className="text-lg font-semibold text-gray-800">Нет данных для отображения</h3>
            <p className="mt-1 text-sm">
              За выбранный период времени отчеты отсутствуют. Попробуйте изменить фильтр или дождитесь, пока сотрудники их отправят.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports; 