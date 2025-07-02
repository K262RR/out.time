-- Создаем функцию для выполнения SQL
CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    EXECUTE sql_query;
END;
$$; 