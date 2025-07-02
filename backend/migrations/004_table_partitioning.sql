-- Создаем партиционированную таблицу time_records_partitioned
CREATE TABLE time_records_partitioned (
    id SERIAL,
    employee_id INTEGER NOT NULL,
    date DATE NOT NULL,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'work',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
) PARTITION BY RANGE (date);

-- Создаем партиции по месяцам на год вперед
DO $$
DECLARE
    start_date DATE := DATE_TRUNC('month', CURRENT_DATE - INTERVAL '6 months');
    end_date DATE := DATE_TRUNC('month', CURRENT_DATE + INTERVAL '6 months');
    partition_date DATE;
    partition_name TEXT;
    start_range TEXT;
    end_range TEXT;
BEGIN
    partition_date := start_date;
    WHILE partition_date < end_date LOOP
        partition_name := 'time_records_p' || TO_CHAR(partition_date, 'YYYY_MM');
        start_range := TO_CHAR(partition_date, 'YYYY-MM-DD');
        end_range := TO_CHAR(partition_date + INTERVAL '1 month', 'YYYY-MM-DD');
        
        EXECUTE format(
            'CREATE TABLE %I PARTITION OF time_records_partitioned 
            FOR VALUES FROM (%L) TO (%L)',
            partition_name, start_range, end_range
        );
        
        -- Создаем индексы для каждой партиции
        EXECUTE format(
            'CREATE INDEX %I ON %I (employee_id, date)',
            partition_name || '_employee_date_idx',
            partition_name
        );
        
        partition_date := partition_date + INTERVAL '1 month';
    END LOOP;
END $$;

-- Создаем партиционированную таблицу reports_partitioned
CREATE TABLE reports_partitioned (
    id SERIAL,
    employee_id INTEGER NOT NULL,
    date DATE NOT NULL,
    content TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_employee_report FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
) PARTITION BY RANGE (date);

-- Создаем партиции по месяцам на год вперед для reports
DO $$
DECLARE
    start_date DATE := DATE_TRUNC('month', CURRENT_DATE - INTERVAL '6 months');
    end_date DATE := DATE_TRUNC('month', CURRENT_DATE + INTERVAL '6 months');
    partition_date DATE;
    partition_name TEXT;
    start_range TEXT;
    end_range TEXT;
BEGIN
    partition_date := start_date;
    WHILE partition_date < end_date LOOP
        partition_name := 'reports_p' || TO_CHAR(partition_date, 'YYYY_MM');
        start_range := TO_CHAR(partition_date, 'YYYY-MM-DD');
        end_range := TO_CHAR(partition_date + INTERVAL '1 month', 'YYYY-MM-DD');
        
        EXECUTE format(
            'CREATE TABLE %I PARTITION OF reports_partitioned 
            FOR VALUES FROM (%L) TO (%L)',
            partition_name, start_range, end_range
        );
        
        -- Создаем индексы для каждой партиции
        EXECUTE format(
            'CREATE INDEX %I ON %I (employee_id, date)',
            partition_name || '_employee_date_idx',
            partition_name
        );
        
        partition_date := partition_date + INTERVAL '1 month';
    END LOOP;
END $$;

-- Функция для создания новых партиций
CREATE OR REPLACE FUNCTION create_new_partitions()
RETURNS void AS $$
DECLARE
    next_month DATE;
    partition_name TEXT;
    start_range TEXT;
    end_range TEXT;
BEGIN
    -- Вычисляем следующий месяц
    next_month := DATE_TRUNC('month', CURRENT_DATE + INTERVAL '6 months');
    
    -- Создаем партицию для time_records
    partition_name := 'time_records_p' || TO_CHAR(next_month, 'YYYY_MM');
    start_range := TO_CHAR(next_month, 'YYYY-MM-DD');
    end_range := TO_CHAR(next_month + INTERVAL '1 month', 'YYYY-MM-DD');
    
    -- Проверяем существование партиции
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_class c 
        JOIN pg_namespace n ON n.oid = c.relnamespace 
        WHERE c.relname = partition_name
    ) THEN
        -- Создаем партицию для time_records
        EXECUTE format(
            'CREATE TABLE %I PARTITION OF time_records_partitioned 
            FOR VALUES FROM (%L) TO (%L)',
            partition_name, start_range, end_range
        );
        
        -- Создаем индекс для новой партиции
        EXECUTE format(
            'CREATE INDEX %I ON %I (employee_id, date)',
            partition_name || '_employee_date_idx',
            partition_name
        );
    END IF;
    
    -- Создаем партицию для reports
    partition_name := 'reports_p' || TO_CHAR(next_month, 'YYYY_MM');
    
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_class c 
        JOIN pg_namespace n ON n.oid = c.relnamespace 
        WHERE c.relname = partition_name
    ) THEN
        -- Создаем партицию для reports
        EXECUTE format(
            'CREATE TABLE %I PARTITION OF reports_partitioned 
            FOR VALUES FROM (%L) TO (%L)',
            partition_name, start_range, end_range
        );
        
        -- Создаем индекс для новой партиции
        EXECUTE format(
            'CREATE INDEX %I ON %I (employee_id, date)',
            partition_name || '_employee_date_idx',
            partition_name
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Создаем триггер для автоматического создания новых партиций
CREATE OR REPLACE FUNCTION check_partition_trigger()
RETURNS trigger AS $$
BEGIN
    PERFORM create_new_partitions();
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE EVENT TRIGGER partition_maintenance ON ddl_command_end
WHEN TAG IN ('CREATE TABLE')
EXECUTE FUNCTION check_partition_trigger();

-- Создаем функцию для переноса данных
CREATE OR REPLACE FUNCTION migrate_to_partitioned_tables()
RETURNS void AS $$
BEGIN
    -- Переносим данные в партиционированную таблицу time_records
    INSERT INTO time_records_partitioned 
    SELECT * FROM time_records;
    
    -- Переносим данные в партиционированную таблицу reports
    INSERT INTO reports_partitioned 
    SELECT * FROM reports;
    
    -- Переименовываем таблицы
    ALTER TABLE time_records RENAME TO time_records_old;
    ALTER TABLE time_records_partitioned RENAME TO time_records;
    
    ALTER TABLE reports RENAME TO reports_old;
    ALTER TABLE reports_partitioned RENAME TO reports;
    
    -- Создаем представления для обратной совместимости
    CREATE OR REPLACE VIEW time_records_view AS SELECT * FROM time_records;
    CREATE OR REPLACE VIEW reports_view AS SELECT * FROM reports;
END;
$$ LANGUAGE plpgsql;

-- Создаем функцию для отката изменений
CREATE OR REPLACE FUNCTION rollback_partitioned_tables()
RETURNS void AS $$
BEGIN
    -- Переименовываем таблицы обратно
    ALTER TABLE time_records RENAME TO time_records_partitioned;
    ALTER TABLE time_records_old RENAME TO time_records;
    
    ALTER TABLE reports RENAME TO reports_partitioned;
    ALTER TABLE reports_old RENAME TO reports;
    
    -- Удаляем представления
    DROP VIEW IF EXISTS time_records_view;
    DROP VIEW IF EXISTS reports_view;
END;
$$ LANGUAGE plpgsql; 