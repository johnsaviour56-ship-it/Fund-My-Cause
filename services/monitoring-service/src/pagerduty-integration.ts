/**
 * PagerDuty Integration for Incident Management
 */

import fetch from 'node-fetch';
import winston from 'winston';

/**
 * Logger configuration
 */
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'pagerduty-integration' },
  transports: [
    new winston.transports.File({ filename: 'pagerduty.log' }),
  ],
});

/**
 * PagerDuty event types
 */
export enum PagerDutyEventType {
  TRIGGER = 'trigger',
  ACKNOWLEDGE = 'acknowledge',
  RESOLVE = 'resolve',
}

/**
 * PagerDuty event severity
 */
export enum PagerDutySeverity {
  CRITICAL = 'critical',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
}

/**
 * PagerDuty client
 */
export class PagerDutyClient {
  private apiKey: string;
  private integrationKey: string;
  private apiEndpoint = 'https://api.pagerduty.com';
  private eventsEndpoint = 'https://events.pagerduty.com/v2/enqueue';

  constructor(apiKey?: string, integrationKey?: string) {
    this.apiKey = apiKey || process.env.PAGERDUTY_API_KEY || '';
    this.integrationKey = integrationKey || process.env.PAGERDUTY_INTEGRATION_KEY || '';

    if (!this.apiKey || !this.integrationKey) {
      logger.warn('PagerDuty credentials not configured');
    }
  }

  /**
   * Send event to PagerDuty
   */
  async sendEvent(
    eventType: PagerDutyEventType,
    serviceKey: string,
    summary: string,
    severity: PagerDutySeverity,
    details: Record<string, unknown>,
    dedupKey?: string
  ) {
    try {
      const body = {
        routing_key: serviceKey,
        event_action: eventType,
        dedup_key: dedupKey,
        payload: {
          summary,
          severity,
          source: 'Fund My Cause Monitoring',
          component: details.service || 'unknown',
          custom_details: details,
        },
      };

      const response = await fetch(this.eventsEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`PagerDuty API error: ${response.statusText}`);
      }

      const data = (await response.json()) as Record<string, unknown>;

      logger.info('Event sent to PagerDuty', {
        event_type: eventType,
        status: data.status,
        dedup_key: dedupKey,
      });

      return data;
    } catch (error) {
      logger.error('Failed to send event to PagerDuty', {
        error: (error as Error).message,
        event_type: eventType,
      });
      throw error;
    }
  }

  /**
   * Trigger incident
   */
  async triggerIncident(
    serviceKey: string,
    summary: string,
    severity: PagerDutySeverity,
    details: Record<string, unknown>,
    dedupKey?: string
  ) {
    return this.sendEvent(
      PagerDutyEventType.TRIGGER,
      serviceKey,
      summary,
      severity,
      details,
      dedupKey
    );
  }

  /**
   * Acknowledge incident
   */
  async acknowledgeIncident(
    serviceKey: string,
    dedupKey: string,
    summary: string
  ) {
    return this.sendEvent(
      PagerDutyEventType.ACKNOWLEDGE,
      serviceKey,
      summary,
      PagerDutySeverity.INFO,
      {},
      dedupKey
    );
  }

  /**
   * Resolve incident
   */
  async resolveIncident(
    serviceKey: string,
    dedupKey: string,
    summary: string
  ) {
    return this.sendEvent(
      PagerDutyEventType.RESOLVE,
      serviceKey,
      summary,
      PagerDutySeverity.INFO,
      {},
      dedupKey
    );
  }

  /**
   * Get incidents from PagerDuty
   */
  async getIncidents(statuses: string[] = ['triggered', 'acknowledged']) {
    try {
      const query = new URLSearchParams({
        statuses: statuses.join(','),
        limit: '100',
      });

      const response = await fetch(`${this.apiEndpoint}/incidents?${query}`, {
        method: 'GET',
        headers: {
          Authorization: `Token token=${this.apiKey}`,
          'Content-Type': 'application/json',
          Accept: 'application/vnd.pagerduty+json;version=2',
        },
      });

      if (!response.ok) {
        throw new Error(`PagerDuty API error: ${response.statusText}`);
      }

      const data = (await response.json()) as Record<string, unknown>;
      return data;
    } catch (error) {
      logger.error('Failed to get incidents from PagerDuty', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Get oncall users
   */
  async getOncallUsers() {
    try {
      const response = await fetch(`${this.apiEndpoint}/oncalls?limit=100`, {
        method: 'GET',
        headers: {
          Authorization: `Token token=${this.apiKey}`,
          'Content-Type': 'application/json',
          Accept: 'application/vnd.pagerduty+json;version=2',
        },
      });

      if (!response.ok) {
        throw new Error(`PagerDuty API error: ${response.statusText}`);
      }

      const data = (await response.json()) as Record<string, unknown>;
      return data;
    } catch (error) {
      logger.error('Failed to get oncall users from PagerDuty', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Create escalation policy
   */
  async createEscalationPolicy(
    name: string,
    escalationRules: Array<{
      escalationDelayInMinutes: number;
      targets: Array<{ id: string; type: string }>;
    }>
  ) {
    try {
      const body = {
        escalation_policy: {
          type: 'escalation_policy',
          name,
          escalation_rules: escalationRules,
        },
      };

      const response = await fetch(`${this.apiEndpoint}/escalation_policies`, {
        method: 'POST',
        headers: {
          Authorization: `Token token=${this.apiKey}`,
          'Content-Type': 'application/json',
          Accept: 'application/vnd.pagerduty+json;version=2',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`PagerDuty API error: ${response.statusText}`);
      }

      const data = (await response.json()) as Record<string, unknown>;

      logger.info('Escalation policy created', { policy_name: name });
      return data;
    } catch (error) {
      logger.error('Failed to create escalation policy', {
        error: (error as Error).message,
      });
      throw error;
    }
  }
}

/**
 * PagerDuty webhook handler
 */
export class PagerDutyWebhookHandler {
  handleWebhook(payload: Record<string, unknown>) {
    logger.info('PagerDuty webhook received', { event_type: payload.type });

    // Handle different event types
    switch (payload.type) {
      case 'incident.triggered':
        return this.handleIncidentTriggered(payload);
      case 'incident.acknowledged':
        return this.handleIncidentAcknowledged(payload);
      case 'incident.resolved':
        return this.handleIncidentResolved(payload);
      default:
        logger.debug('Unknown webhook event type', { type: payload.type });
    }
  }

  private handleIncidentTriggered(payload: Record<string, unknown>) {
    logger.info('Incident triggered in PagerDuty', payload);
    // Sync incident to local incident management system
  }

  private handleIncidentAcknowledged(payload: Record<string, unknown>) {
    logger.info('Incident acknowledged in PagerDuty', payload);
    // Update incident status
  }

  private handleIncidentResolved(payload: Record<string, unknown>) {
    logger.info('Incident resolved in PagerDuty', payload);
    // Update incident status and record resolution time
  }
}

/**
 * Alert to PagerDuty mapping
 */
export function mapAlertToPagerDuty(alert: Record<string, unknown>) {
  const severity = alert.severity as string;
  const pagerDutySeverity = {
    critical: PagerDutySeverity.CRITICAL,
    error: PagerDutySeverity.ERROR,
    warning: PagerDutySeverity.WARNING,
    info: PagerDutySeverity.INFO,
  }[severity] || PagerDutySeverity.ERROR;

  return {
    summary: alert.message,
    severity: pagerDutySeverity,
    details: alert,
    dedupKey: alert.alert_id,
  };
}
