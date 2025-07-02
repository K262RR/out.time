import Report from '../models/Report.js';
import ApiError from '../utils/ApiError.js';

class ReportService {
  /**
   * Получает отчеты для компании с фильтрацией и пагинацией.
   * @param {number} companyId - ID компании.
   * @param {object} filters - Объект с фильтрами (startDate, endDate, employeeId, page, limit).
   * @returns {Promise<object>} - Объект с отчетами и информацией о пагинации.
   */
  static async getReports(companyId, filters) {
    const { 
      page = 1, 
      limit = 20,
      employeeId,
      startDate,
      endDate
    } = filters;

    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const end = endDate || new Date().toISOString().split('T')[0];

    const allReports = await Report.findByCompanyAndDateRange(
      companyId, 
      start, 
      end, 
      employeeId ? parseInt(employeeId) : null
    );

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const paginatedReports = allReports.slice(offset, offset + parseInt(limit));
    const totalPages = Math.ceil(allReports.length / parseInt(limit));

    return {
      reports: paginatedReports,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalReports: allReports.length,
        hasNext: parseInt(page) < totalPages,
        hasPrev: parseInt(page) > 1,
      },
    };
  }

  static async createReport(reportData) {
    try {
      return await Report.create(reportData);
    } catch (error) {
      throw new ApiError(500, 'Ошибка при создании отчета', { error: error.message });
    }
  }

  static async getReportsByEmployeeId(employeeId) {
    try {
      return await Report.findByEmployeeId(employeeId);
    } catch (error) {
      throw new ApiError(500, 'Ошибка при получении отчетов сотрудника', { error: error.message });
    }
  }

  static async updateReport(reportId, updateData) {
    try {
      const report = await Report.update(reportId, updateData);
      if (!report) {
        throw new ApiError(404, 'Отчет не найден');
      }
      return report;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Ошибка при обновлении отчета', { error: error.message });
    }
  }

  static async deleteReport(reportId) {
    try {
      const result = await Report.delete(reportId);
      if (!result) {
        throw new ApiError(404, 'Отчет не найден');
      }
      return result;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Ошибка при удалении отчета', { error: error.message });
    }
  }

  static async getReports(filters = {}) {
    try {
      return await Report.findAll(filters);
    } catch (error) {
      throw new ApiError(500, 'Ошибка при получении отчетов', { error: error.message });
    }
  }

  static async getReportById(reportId) {
    try {
      const report = await Report.findById(reportId);
      if (!report) {
        throw new ApiError(404, 'Отчет не найден');
      }
      return report;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, 'Ошибка при получении отчета', { error: error.message });
    }
  }
}

export default ReportService; 