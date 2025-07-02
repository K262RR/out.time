import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import EmployeeService from '../../src/services/employeeService.js';
import Employee from '../../src/models/Employee.js';
import Invite from '../../src/models/Invite.js';

jest.mock('../../src/models/Employee');
jest.mock('../../src/models/Invite');

describe('EmployeeService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getEmployeesByCompany', () => {
    it('should return employees for a given company id', async () => {
      const mockEmployees = [
        { id: 1, name: 'John Doe', companyId: 1 },
        { id: 2, name: 'Jane Doe', companyId: 1 },
      ];
      Employee.findByCompany.mockResolvedValue(mockEmployees);

      const companyId = 1;
      const employees = await EmployeeService.getEmployeesByCompany(companyId);

      expect(Employee.findByCompany).toHaveBeenCalledWith(companyId);
      expect(employees).toEqual(mockEmployees);
      expect(employees.length).toBe(2);
    });

    it('should return an empty array if no employees found', async () => {
      Employee.findByCompany.mockResolvedValue([]);

      const companyId = 99;
      const employees = await EmployeeService.getEmployeesByCompany(companyId);

      expect(Employee.findByCompany).toHaveBeenCalledWith(companyId);
      expect(employees).toEqual([]);
    });
  });

  describe('createInvite', () => {
    it('should revoke previous invites, create a new one, and return it with a link', async () => {
      const companyId = 1;
      const employeeName = 'New Employee';
      const mockInvite = {
        token: 'test-token-123',
        companyId,
        employeeName,
      };

      Invite.create.mockResolvedValue(mockInvite);
      Invite.revokeByName.mockResolvedValue(); // Doesn't need to return anything

      const result = await EmployeeService.createInvite(companyId, employeeName);

      expect(Invite.revokeByName).toHaveBeenCalledWith(companyId, employeeName);
      expect(Invite.create).toHaveBeenCalledWith({ companyId, employeeName });
      
      const botUsername = process.env.BOT_USERNAME || 'outtimeagency_bot';
      expect(result.invite).toEqual(mockInvite);
      expect(result.inviteLink).toBe(`https://t.me/${botUsername}?start=${mockInvite.token}`);
    });
  });

  describe('deactivateEmployee', () => {
    it('should deactivate an employee if found', async () => {
      const employeeId = 1;
      const mockEmployee = { id: employeeId, name: 'John Doe', is_active: true };
      const mockDeactivatedEmployee = { ...mockEmployee, is_active: false };

      Employee.findById.mockResolvedValue(mockEmployee);
      Employee.deactivate.mockResolvedValue(mockDeactivatedEmployee);

      const result = await EmployeeService.deactivateEmployee(employeeId);

      expect(Employee.findById).toHaveBeenCalledWith(employeeId);
      expect(Employee.deactivate).toHaveBeenCalledWith(employeeId);
      expect(result).toEqual(mockDeactivatedEmployee);
    });

    it('should throw an error if employee not found', async () => {
      const employeeId = 99;
      Employee.findById.mockResolvedValue(null);

      await expect(EmployeeService.deactivateEmployee(employeeId)).rejects.toThrow('Сотрудник не найден');

      expect(Employee.findById).toHaveBeenCalledWith(employeeId);
      expect(Employee.deactivate).not.toHaveBeenCalled();
    });
  });
}); 