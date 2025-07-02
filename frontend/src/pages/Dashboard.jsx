import React, { useState, useEffect, useMemo, memo } from 'react';
import { dashboardService } from '../services/dashboardService';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import DashboardSkeleton from '../components/ui/DashboardSkeleton';

// Оптимизированная иконка с градиентом
const StatIcon = memo(({ bgColor, gradientId, gradientStops }) => (
  <div className={`${bgColor} relative rounded-lg w-[32px] h-[32px] flex items-center justify-center`}>
    <svg width="20" height="16" viewBox="0 0 21 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18.1588 1.96745C13.8644 6.62991 6.37997 6.62991 1.9629 1.96745" stroke={`url(#${gradientId})`} strokeWidth="3.92629" strokeLinecap="round"/>
      <g transform="translate(0, 8) scale(1, -1)">
        <path d="M18.1588 1.96745C13.8644 6.62991 6.37997 6.62991 1.9629 1.96745" stroke={`url(#${gradientId})`} strokeWidth="3.92629" strokeLinecap="round"/>
      </g>
      <defs>
        <linearGradient id={gradientId} x1="1.9629" y1="3.83154" x2="18.1588" y2="3.83154" gradientUnits="userSpaceOnUse">
          <stop stopColor={gradientStops[0]} stopOpacity={gradientStops[1]}/>
          <stop offset="1" stopColor={gradientStops[0]} stopOpacity="0"/>
        </linearGradient>
      </defs>
    </svg>
  </div>
));

// Переиспользуемый компонент карточки статистики
const StatCard = memo(({ icon, title, value, subtitle, minHeight = "min-h-[140px] sm:min-h-[165px]" }) => (
  <div className={`bg-[#f8f8f8] rounded-[30px] p-4 sm:p-[22px] flex flex-col justify-between ${minHeight}`}>
    <div>{icon}</div>
    <div>
      {subtitle && <p className="text-sm text-gray-500 leading-tight">{subtitle}</p>}
      <p className="text-sm text-gray-500 leading-tight">{title}</p>
      <p className="text-2xl sm:text-[26px] font-semibold text-black tracking-tight sm:tracking-[-1.04px]">
        {value}
      </p>
    </div>
  </div>
));

// Мемоизированные иконки
const WorkingTodayIcon = memo(() => (
  <StatIcon 
    bgColor="bg-[#d4ffe3]" 
    gradientId="grad1" 
    gradientStops={["#B3E0A9", "0.55"]} 
  />
));

const ReportsTodayIcon = memo(() => (
  <StatIcon 
    bgColor="bg-[#e6eeff]" 
    gradientId="grad2" 
    gradientStops={["#5D8FF4", "0.55"]} 
  />
));

const AverageDurationIcon = memo(() => (
  <StatIcon 
    bgColor="bg-[#d4f3fb]" 
    gradientId="grad3" 
    gradientStops={["#10BBED", "0.55"]} 
  />
));

const AbsentIcon = memo(() => (
  <StatIcon 
    bgColor="bg-[#ffe9e6]" 
    gradientId="grad4" 
    gradientStops={["#FF6C59", "0.55"]} 
  />
));

// Компонент элемента отчета
const RecentReportItem = memo(({ report }) => (
  <div className="bg-[#f8f8f8] rounded-[30px] p-4 sm:p-[22px]">
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
      <div className="flex-grow">
        <p className="text-base font-semibold text-black tracking-[-0.32px]">{report.employeeName}</p>
        <p className="text-sm text-gray-500">{report.content}</p>
      </div>
      <div className="text-left sm:text-right flex-shrink-0">
        <p className="text-sm text-gray-500">{format(new Date(report.date), 'dd.MM.yyyy')}</p>
        <p className="text-xs text-gray-500">{format(new Date(report.createdAt), 'HH:mm:ss')}</p>
      </div>
    </div>
  </div>
));

// Компонент сетки статистики
const StatsGrid = memo(({ todayStats }) => {
  const statsCards = useMemo(() => [
    {
      icon: <WorkingTodayIcon />,
      title: "Работают сегодня",
      value: `${todayStats.workingToday}/${todayStats.totalEmployees}`,
    },
    {
      icon: <ReportsTodayIcon />,
      title: "Отчеты сегодня", 
      value: todayStats.reportsToday,
    },
    {
      icon: <AverageDurationIcon />,
      title: "продолжительность",
      subtitle: "Средняя",
      value: `${todayStats.averageWorkHours}ч`,
    },
    {
      icon: <AbsentIcon />,
      title: "Отсутствуют",
      value: todayStats.sickToday + todayStats.vacationToday,
    }
  ], [todayStats]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-[3px]">
      {statsCards.map((card, index) => (
        <StatCard key={index} {...card} />
      ))}
    </div>
  );
});

// Компонент списка отчетов
const RecentReportsList = memo(({ reports }) => {
  if (!reports?.length) {
    return (
      <div className="bg-[#f8f8f8] rounded-[16px] p-10 text-center text-gray-500">
        <h3 className="text-lg font-semibold text-gray-800">Нет недавних отчетов</h3>
        <p className="mt-1 text-sm">
          Отчеты сотрудников будут отображаться здесь.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-[3px]">
      {reports.map((report, index) => (
        <RecentReportItem key={`${report.id}-${index}`} report={report} />
      ))}
    </div>
  );
});

// Компонент пустого состояния
const EmptyState = memo(() => (
  <div className="bg-[#f8f8f8] rounded-[16px] p-10 text-center text-gray-500">
    <h3 className="text-lg font-semibold text-gray-800">Недостаточно данных</h3>
    <p className="mt-1 text-sm">
      Как только ваши сотрудники начнут отмечаться, здесь появится статистика.
    </p>
  </div>
));

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    todayStats: {
      totalEmployees: 0,
      workingToday: 0,
      sickToday: 0,
      vacationToday: 0,
      reportsToday: 0,
      averageWorkHours: '0.0'
    },
    recentReports: [],
    employeeStats: []
  });
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboardData = React.useCallback(async () => {
    try {
      const data = await dashboardService.getDashboardData();
      setDashboardData(data);
    } catch (error) {
      toast.error('Не удалось загрузить данные дашборда');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Мемоизируем вычисленные значения
  const hasData = useMemo(() => 
    dashboardData.todayStats.totalEmployees > 0, 
    [dashboardData.todayStats.totalEmployees]
  );

  const hasReports = useMemo(() => 
    dashboardData.recentReports?.length > 0, 
    [dashboardData.recentReports]
  );

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-6">
      {/* Основная статистика */}
      <div className="bg-[rgba(255,255,255,0.6)] rounded-[19px] p-[13px] mb-[23px]">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 leading-tight sm:leading-[32px]">Дашборд</h1>
          <p className="text-sm text-[#727272]">Общая статистика по компании</p>
        </div>

        {hasData ? (
          <StatsGrid todayStats={dashboardData.todayStats} />
        ) : (
          <EmptyState />
        )}
      </div>

      {/* Недавние отчеты */}
      {hasData && (
        <div className="bg-[rgba(255,255,255,0.6)] rounded-[19px] p-[13px]">
          <div className="mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Недавние отчеты</h2>
            <p className="text-sm text-[#727272]">Последние отчеты сотрудников</p>
          </div>

          <RecentReportsList reports={dashboardData.recentReports} />
        </div>
      )}
    </div>
  );
};

export default memo(Dashboard); 