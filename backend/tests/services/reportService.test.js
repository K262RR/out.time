import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import ReportService from '../../src/services/reportService.js';
import Report from '../../src/models/Report.js';

jest.mock('../../src/models/Report.js');

describe('ReportService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createReport', () => {
    it('should create a report successfully', async () => {
      const reportData = {
        employeeId: 1,
        date: '2024-03-20',
        hours: 8,
        description: 'Test report'
      };

      const mockReport = {
        id: 1,
        ...reportData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      Report.create.mockResolvedValue(mockReport);

      const result = await ReportService.createReport(reportData);

      expect(Report.create).toHaveBeenCalledWith(reportData);
      expect(result).toEqual(mockReport);
    });

    it('should throw an error if report creation fails', async () => {
      const reportData = {
        employeeId: 1,
        date: '2024-03-20',
        hours: 8,
        description: 'Test report'
      };

      Report.create.mockRejectedValue(new Error('Database error'));

      await expect(ReportService.createReport(reportData)).rejects.toThrow('Database error');
    });
  });

  describe('getReportsByEmployeeId', () => {
    it('should return reports for a specific employee', async () => {
      const employeeId = 1;
      const mockReports = [
        {
          id: 1,
          employeeId,
          date: '2024-03-20',
          hours: 8,
          description: 'Report 1'
        },
        {
          id: 2,
          employeeId,
          date: '2024-03-21',
          hours: 7,
          description: 'Report 2'
        }
      ];

      Report.findByEmployeeId.mockResolvedValue(mockReports);

      const result = await ReportService.getReportsByEmployeeId(employeeId);

      expect(Report.findByEmployeeId).toHaveBeenCalledWith(employeeId);
      expect(result).toEqual(mockReports);
    });

    it('should return empty array if no reports found', async () => {
      const employeeId = 1;

      Report.findByEmployeeId.mockResolvedValue([]);

      const result = await ReportService.getReportsByEmployeeId(employeeId);

      expect(Report.findByEmployeeId).toHaveBeenCalledWith(employeeId);
      expect(result).toEqual([]);
    });
  });

  describe('updateReport', () => {
    it('should update a report successfully', async () => {
      const reportId = 1;
      const updateData = {
        hours: 6,
        description: 'Updated description'
      };

      const mockUpdatedReport = {
        id: reportId,
        employeeId: 1,
        date: '2024-03-20',
        ...updateData,
        updatedAt: new Date()
      };

      Report.update.mockResolvedValue(mockUpdatedReport);

      const result = await ReportService.updateReport(reportId, updateData);

      expect(Report.update).toHaveBeenCalledWith(reportId, updateData);
      expect(result).toEqual(mockUpdatedReport);
    });

    it('should throw an error if report update fails', async () => {
      const reportId = 1;
      const updateData = {
        hours: 6,
        description: 'Updated description'
      };

      Report.update.mockRejectedValue(new Error('Report not found'));

      await expect(ReportService.updateReport(reportId, updateData)).rejects.toThrow('Report not found');
    });
  });

  describe('deleteReport', () => {
    it('should delete a report successfully', async () => {
      const reportId = 1;

      Report.delete.mockResolvedValue(true);

      const result = await ReportService.deleteReport(reportId);

      expect(Report.delete).toHaveBeenCalledWith(reportId);
      expect(result).toBe(true);
    });

    it('should throw an error if report deletion fails', async () => {
      const reportId = 1;

      Report.delete.mockRejectedValue(new Error('Report not found'));

      await expect(ReportService.deleteReport(reportId)).rejects.toThrow('Report not found');
    });
  });

  describe('getReports', () => {
    it('should fetch and paginate reports correctly', async () => {
      const companyId = 1;
      const filters = { page: 1, limit: 10 };
      const mockReports = Array.from({ length: 15 }, (_, i) => ({
        id: i + 1,
        content: `Report ${i + 1}`,
      }));

      Report.findByCompanyAndDateRange.mockResolvedValue(mockReports);

      const result = await ReportService.getReports(companyId, filters);

      expect(Report.findByCompanyAndDateRange).toHaveBeenCalled();
      expect(result.reports.length).toBe(10);
      expect(result.pagination.totalReports).toBe(15);
      expect(result.pagination.totalPages).toBe(2);
      expect(result.pagination.currentPage).toBe(1);
      expect(result.pagination.hasNext).toBe(true);
      expect(result.pagination.hasPrev).toBe(false);
    });

    it('should handle the last page of pagination', async () => {
      const companyId = 1;
      const filters = { page: 2, limit: 10 };
       const mockReports = Array.from({ length: 15 }, (_, i) => ({
        id: i + 1,
        content: `Report ${i + 1}`,
      }));
      
      Report.findByCompanyAndDateRange.mockResolvedValue(mockReports);

      const result = await ReportService.getReports(companyId, filters);

      expect(result.reports.length).toBe(5);
      expect(result.pagination.currentPage).toBe(2);
      expect(result.pagination.hasNext).toBe(false);
      expect(result.pagination.hasPrev).toBe(true);
    });
  });
}); 