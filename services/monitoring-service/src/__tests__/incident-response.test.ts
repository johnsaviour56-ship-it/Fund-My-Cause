/**
 * Incident Response Tests
 */

import {
  IncidentResponseEngine,
  IncidentEscalationManager,
  CommonRemediations,
} from '../incident-response';

describe('IncidentResponseEngine', () => {
  let engine: IncidentResponseEngine;

  beforeEach(() => {
    engine = new IncidentResponseEngine();
  });

  describe('registerRemediation', () => {
    it('should register remediation action', () => {
      const action = {
        name: 'test-action',
        description: 'Test action',
        execute: async () => {},
      };

      engine.registerRemediation('test-incident', action);
      expect(engine).toBeDefined();
    });

    it('should register multiple remediations for same incident type', () => {
      const action1 = {
        name: 'action-1',
        description: 'Test action 1',
        execute: async () => {},
      };

      const action2 = {
        name: 'action-2',
        description: 'Test action 2',
        execute: async () => {},
      };

      engine.registerRemediation('test-incident', action1);
      engine.registerRemediation('test-incident', action2);
      expect(engine).toBeDefined();
    });
  });

  describe('executeRemediation', () => {
    it('should execute registered remediations', async () => {
      const executeMock = jest.fn();
      const action = {
        name: 'test-action',
        description: 'Test action',
        execute: executeMock,
      };

      engine.registerRemediation('test-incident', action);
      await engine.executeRemediation('test-incident', {});

      expect(executeMock).toHaveBeenCalled();
    });

    it('should handle remediation timeout', async () => {
      const action = {
        name: 'slow-action',
        description: 'Slow action',
        execute: async () => {
          return new Promise((resolve) => setTimeout(resolve, 500));
        },
        timeout: 100,
      };

      engine.registerRemediation('test-incident', action);
      await engine.executeRemediation('test-incident', {});
      // Should not throw, just log error
      expect(engine).toBeDefined();
    });

    it('should return empty if no remediations registered', async () => {
      await engine.executeRemediation('unknown-incident', {});
      expect(engine).toBeDefined();
    });
  });

  describe('rollbackRemediation', () => {
    it('should execute rollback actions', async () => {
      const rollbackMock = jest.fn();
      const action = {
        name: 'test-action',
        description: 'Test action',
        execute: async () => {},
        rollback: rollbackMock,
      };

      engine.registerRemediation('test-incident', action);
      await engine.rollbackRemediation('test-incident');

      expect(rollbackMock).toHaveBeenCalled();
    });

    it('should rollback in reverse order', async () => {
      const order: string[] = [];

      const action1 = {
        name: 'action-1',
        description: 'Action 1',
        execute: async () => {},
        rollback: async () => {
          order.push('rollback-1');
        },
      };

      const action2 = {
        name: 'action-2',
        description: 'Action 2',
        execute: async () => {},
        rollback: async () => {
          order.push('rollback-2');
        },
      };

      engine.registerRemediation('test-incident', action1);
      engine.registerRemediation('test-incident', action2);
      await engine.rollbackRemediation('test-incident');

      expect(order).toEqual(['rollback-2', 'rollback-1']);
    });
  });

  describe('getActiveRemediations', () => {
    it('should return active remediations', async () => {
      const action = {
        name: 'test-action',
        description: 'Test action',
        execute: async () => {},
      };

      engine.registerRemediation('test-incident', action);
      await engine.executeRemediation('test-incident', {});

      const active = engine.getActiveRemediations();
      expect(active).toHaveLength(1);
    });
  });
});

describe('IncidentEscalationManager', () => {
  let manager: IncidentEscalationManager;

  beforeEach(() => {
    manager = new IncidentEscalationManager();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  describe('registerPolicy', () => {
    it('should register escalation policy', () => {
      const policy = {
        level: 1,
        delay: 300000,
        action: async () => {},
      };

      manager.registerPolicy('test-incident', policy);
      expect(manager).toBeDefined();
    });

    it('should sort policies by level', () => {
      const policy1 = {
        level: 2,
        delay: 600000,
        action: async () => {},
      };

      const policy2 = {
        level: 1,
        delay: 300000,
        action: async () => {},
      };

      manager.registerPolicy('test-incident', policy1);
      manager.registerPolicy('test-incident', policy2);
      expect(manager).toBeDefined();
    });
  });

  describe('startEscalation', () => {
    it('should start escalation timers', () => {
      jest.useFakeTimers();

      const actionMock = jest.fn();
      const policy = {
        level: 1,
        delay: 300000,
        action: actionMock,
      };

      manager.registerPolicy('test-incident', policy);
      manager.startEscalation('incident-1', 'test-incident', {});

      expect(actionMock).not.toHaveBeenCalled();

      jest.advanceTimersByTime(300000);

      expect(actionMock).toHaveBeenCalled();
      jest.useRealTimers();
    });
  });

  describe('cancelEscalation', () => {
    it('should cancel escalation timers', () => {
      jest.useFakeTimers();

      const actionMock = jest.fn();
      const policy = {
        level: 1,
        delay: 300000,
        action: actionMock,
      };

      manager.registerPolicy('test-incident', policy);
      manager.startEscalation('incident-1', 'test-incident', {});
      manager.cancelEscalation('incident-1');

      jest.advanceTimersByTime(300000);

      expect(actionMock).not.toHaveBeenCalled();
      jest.useRealTimers();
    });
  });
});

describe('CommonRemediations', () => {
  it('should have scaleUpService remediation', () => {
    const action = CommonRemediations.scaleUpService('api-service');
    expect(action.name).toBe('scale-up-service');
    expect(action.execute).toBeDefined();
  });

  it('should have clearCache remediation', () => {
    const action = CommonRemediations.clearCache('redis');
    expect(action.name).toBe('clear-cache');
    expect(action.execute).toBeDefined();
  });

  it('should have restartService remediation', () => {
    const action = CommonRemediations.restartService('api-service');
    expect(action.name).toBe('restart-service');
    expect(action.execute).toBeDefined();
  });

  it('should have killLongQueries remediation', () => {
    const action = CommonRemediations.killLongQueries('postgres', 300);
    expect(action.name).toBe('kill-long-queries');
    expect(action.execute).toBeDefined();
  });

  it('should have enableCircuitBreaker remediation', () => {
    const action = CommonRemediations.enableCircuitBreaker('api-service');
    expect(action.name).toBe('enable-circuit-breaker');
    expect(action.execute).toBeDefined();
    expect(action.rollback).toBeDefined();
  });

  it('should have reduceWorkload remediation', () => {
    const action = CommonRemediations.reduceWorkload('api-service');
    expect(action.name).toBe('reduce-workload');
    expect(action.execute).toBeDefined();
    expect(action.rollback).toBeDefined();
  });

  it('should have enableMaintenanceMode remediation', () => {
    const action = CommonRemediations.enableMaintenanceMode();
    expect(action.name).toBe('enable-maintenance-mode');
    expect(action.execute).toBeDefined();
    expect(action.rollback).toBeDefined();
  });

  it('should have failoverToBackup remediation', () => {
    const action = CommonRemediations.failoverToBackup('api-service');
    expect(action.name).toBe('failover-to-backup');
    expect(action.execute).toBeDefined();
    expect(action.rollback).toBeDefined();
  });
});
