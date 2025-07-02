-- Оптимизация индексов для улучшения производительности запросов

-- Индексы для time_records
-- Составной индекс для поиска по компании и дате через связь с employees
CREATE INDEX idx_time_records_company_date ON time_records 
USING btree(employee_id, date, status);

-- Индекс для подсчета статистики по времени
CREATE INDEX idx_time_records_start_end_time ON time_records 
USING btree(start_time, end_time) 
WHERE status = 'work';

-- Индекс для поиска опоздавших
CREATE INDEX idx_time_records_late_check ON time_records 
USING btree((start_time::time), status, date);

-- Индексы для reports
-- Составной индекс для поиска по диапазону дат
CREATE INDEX idx_reports_date_range ON reports 
USING btree(employee_id, date DESC);

-- Индекс для быстрого поиска последних отчетов
CREATE INDEX idx_reports_created_at ON reports 
USING btree(created_at DESC);

-- Индексы для employees
-- Составной индекс для активных сотрудников компании
CREATE INDEX idx_employees_company_active ON employees 
USING btree(company_id, is_active) 
WHERE is_active = true;

-- Индекс для поиска по времени создания (для новых сотрудников)
CREATE INDEX idx_employees_created_at ON employees 
USING btree(created_at DESC);

-- Индексы для companies
-- Индекс для поиска по имени компании (UNIQUE уже есть)
CREATE INDEX idx_companies_timezone ON companies 
USING btree(timezone);

-- Индексы для users
-- Составной индекс для поиска пользователя с компанией
CREATE INDEX idx_users_company_email ON users 
USING btree(company_id, email);

-- Индекс для поиска по времени последнего входа
CREATE INDEX idx_users_last_login ON users 
USING btree(last_login DESC);

-- Индексы для invites
-- Составной индекс для активных приглашений
CREATE INDEX idx_invites_active ON invites 
USING btree(company_id, is_used, expires_at) 
WHERE is_used = false;

-- Статистика для оптимизатора
ANALYZE time_records;
ANALYZE reports;
ANALYZE employees;
ANALYZE companies;
ANALYZE users;
ANALYZE invites; 