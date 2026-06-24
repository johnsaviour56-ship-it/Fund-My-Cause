/**
 * PagerDuty Integration Tests
 */

import { PagerDutyClient, PagerDutyEventType, PagerDutySeverity } from '../pagerduty-integration';

// Mock node-fetch
jest.mock('node-fetch');

describe('PagerDutyClient', () => {
  let client: PagerDutyClient;

  beforeEach(() => {
    client = new PagerDutyClient('test-api-key', 'test-integration-key');
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with provided credentials', () => {
      const client = new PagerDutyClient('api-key', 'integration-key');
      expect(client).toBeDefined();
    });

    it('should initialize with environment variables', () => {
      process.env.PAGERDUTY_API_KEY = 'env-api-key';
      process.env.PAGERDUTY_INTEGRATION_KEY = 'env-integration-key';

      const client = new PagerDutyClient();
      expect(client).toBeDefined();

      delete process.env.PAGERDUTY_API_KEY;
      delete process.env.PAGERDUTY_INTEGRATION_KEY;
    });
  });

  describe('sendEvent', () => {
    it('should send event to PagerDuty', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ status: 'success', dedup_key: 'test-key' }),
      };

      const fetchMock = require('node-fetch') as jest.Mock;
      fetchMock.mockResolvedValueOnce(mockResponse);

      const result = await client.sendEvent(
        PagerDutyEventType.TRIGGER,
        'service-key',
        'Test incident',
        PagerDutySeverity.CRITICAL,
        { service: 'api' },
        'dedup-key'
      );

      expect(result).toBeDefined();
      expect(fetchMock).toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      const mockResponse = {
        ok: false,
        statusText: 'Unauthorized',
      };

      const fetchMock = require('node-fetch') as jest.Mock;
      fetchMock.mockResolvedValueOnce(mockResponse);

      await expect(
        client.sendEvent(
          PagerDutyEventType.TRIGGER,
          'service-key',
          'Test incident',
          PagerDutySeverity.CRITICAL,
          { service: 'api' }
        )
      ).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      const fetchMock = require('node-fetch') as jest.Mock;
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        client.sendEvent(
          PagerDutyEventType.TRIGGER,
          'service-key',
          'Test incident',
          PagerDutySeverity.CRITICAL,
          { service: 'api' }
        )
      ).rejects.toThrow();
    });
  });

  describe('triggerIncident', () => {
    it('should trigger incident', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ status: 'success' }),
      };

      const fetchMock = require('node-fetch') as jest.Mock;
      fetchMock.mockResolvedValueOnce(mockResponse);

      const result = await client.triggerIncident(
        'service-key',
        'Critical error',
        PagerDutySeverity.CRITICAL,
        { error: 'Database connection failed' },
        'db-error'
      );

      expect(result).toBeDefined();
    });
  });

  describe('acknowledgeIncident', () => {
    it('should acknowledge incident', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ status: 'success' }),
      };

      const fetchMock = require('node-fetch') as jest.Mock;
      fetchMock.mockResolvedValueOnce(mockResponse);

      const result = await client.acknowledgeIncident('service-key', 'db-error', 'Investigating');

      expect(result).toBeDefined();
    });
  });

  describe('resolveIncident', () => {
    it('should resolve incident', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ status: 'success' }),
      };

      const fetchMock = require('node-fetch') as jest.Mock;
      fetchMock.mockResolvedValueOnce(mockResponse);

      const result = await client.resolveIncident('service-key', 'db-error', 'Issue resolved');

      expect(result).toBeDefined();
    });
  });

  describe('getIncidents', () => {
    it('should get incidents from PagerDuty', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          incidents: [
            {
              id: 'incident-1',
              status: 'triggered',
              summary: 'Test incident',
            },
          ],
        }),
      };

      const fetchMock = require('node-fetch') as jest.Mock;
      fetchMock.mockResolvedValueOnce(mockResponse);

      const result = await client.getIncidents();

      expect(result).toBeDefined();
      expect(result.incidents).toBeDefined();
    });

    it('should get incidents with custom statuses', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ incidents: [] }),
      };

      const fetchMock = require('node-fetch') as jest.Mock;
      fetchMock.mockResolvedValueOnce(mockResponse);

      await client.getIncidents(['acknowledged']);

      expect(fetchMock).toHaveBeenCalled();
    });
  });

  describe('getOncallUsers', () => {
    it('should get oncall users', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          oncalls: [
            {
              id: 'oncall-1',
              user: { id: 'user-1', name: 'John Doe' },
            },
          ],
        }),
      };

      const fetchMock = require('node-fetch') as jest.Mock;
      fetchMock.mockResolvedValueOnce(mockResponse);

      const result = await client.getOncallUsers();

      expect(result).toBeDefined();
      expect(result.oncalls).toBeDefined();
    });
  });

  describe('createEscalationPolicy', () => {
    it('should create escalation policy', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          escalation_policy: { id: 'policy-1', name: 'Test Policy' },
        }),
      };

      const fetchMock = require('node-fetch') as jest.Mock;
      fetchMock.mockResolvedValueOnce(mockResponse);

      const result = await client.createEscalationPolicy('Test Policy', [
        {
          escalationDelayInMinutes: 15,
          targets: [{ id: 'user-1', type: 'user' }],
        },
      ]);

      expect(result).toBeDefined();
    });
  });
});
