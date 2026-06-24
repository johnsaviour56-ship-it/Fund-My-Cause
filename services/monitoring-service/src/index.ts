/**
 * Monitoring Service
 * Provides comprehensive observability, incident response, and alerting
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import { register, Counter, Gauge, Histogram } from 'prometheus-client';
import winston from 'winston';
import { EventEmitter } from 'events';

/**
 * Logger configuration
 */
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'monitoring-service' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

/**
 * Metrics definitions
 */
const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});

const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

const httpErrorsTotal = new Counter({
  name: 'http_errors_total',
  help: 'Total HTTP errors',
  labelNames: ['method', 'route', 'error_type'],
});

const activeAlerts = new Gauge({
  name: 'active_alerts_total',
  help: 'Number of active alerts',
  labelNames: ['severity'],
});

const incidentCounter = new Counter({
  name: 'incidents_total',
  help: 'Total incidents triggered',
  labelNames: ['type', 'severity'],
});

const incidentResolutionTime = new Histogram({
  name: 'incident_resolution_time_seconds',
  help: 'Time to resolve incidents in seconds',
  labelNames: ['type'],
  buckets: [60, 300, 900, 1800, 3600, 7200],
});

/**
 * Incident Manager
 */
class IncidentManager extends EventEmitter {
  private incidents: Map<
    string,
    {
      id: string;
      type: string;
      severity: string;
      createdAt: Date;
      status: 'open' | 'acknowledged' | 'resolved';
      resolvedAt?: Date;
      details: Record<string, unknown>;
    }
  > = new Map();

  createIncident(type: string, severity: string, details: Record<string, unknown>) {
    const id = `incident-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const incident = {
      id,
      type,
      severity,
      createdAt: new Date(),
      status: 'open' as const,
      details,
    };

    this.incidents.set(id, incident);
    incidentCounter.inc({ type, severity });

    logger.warn('Incident created', {
      incident_id: id,
      type,
      severity,
      details,
    });

    this.emit('incident-created', incident);
    return incident;
  }

  acknowledgeIncident(incidentId: string) {
    const incident = this.incidents.get(incidentId);
    if (incident) {
      incident.status = 'acknowledged';
      logger.info('Incident acknowledged', { incident_id: incidentId });
      this.emit('incident-acknowledged', incident);
    }
  }

  resolveIncident(incidentId: string) {
    const incident = this.incidents.get(incidentId);
    if (incident) {
      incident.status = 'resolved';
      incident.resolvedAt = new Date();
      const duration =
        (incident.resolvedAt.getTime() - incident.createdAt.getTime()) / 1000;
      incidentResolutionTime.observe({ type: incident.type }, duration);
      logger.info('Incident resolved', { incident_id: incidentId, duration });
      this.emit('incident-resolved', incident);
    }
  }

  getIncident(incidentId: string) {
    return this.incidents.get(incidentId);
  }

  getActiveIncidents() {
    return Array.from(this.incidents.values()).filter((i) => i.status !== 'resolved');
  }
}

/**
 * Alert Manager
 */
class AlertManager {
  private alerts: Map<
    string,
    {
      id: string;
      name: string;
      severity: string;
      message: string;
      createdAt: Date;
      resolvedAt?: Date;
      metadata: Record<string, unknown>;
    }
  > = new Map();

  private incidentManager: IncidentManager;

  constructor(incidentManager: IncidentManager) {
    this.incidentManager = incidentManager;
  }

  fireAlert(name: string, severity: string, message: string, metadata: Record<string, unknown>) {
    const id = `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const alert = {
      id,
      name,
      severity,
      message,
      createdAt: new Date(),
      metadata,
    };

    this.alerts.set(id, alert);
    activeAlerts.inc({ severity });

    logger.warn('Alert fired', {
      alert_id: id,
      name,
      severity,
      message,
      metadata,
    });

    // Create incident for critical alerts
    if (severity === 'critical') {
      this.incidentManager.createIncident(name, severity, metadata);
    }

    return alert;
  }

  resolveAlert(alertId: string) {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.resolvedAt = new Date();
      activeAlerts.dec({ severity: alert.severity });
      logger.info('Alert resolved', { alert_id: alertId });
    }
  }

  getAlert(alertId: string) {
    return this.alerts.get(alertId);
  }

  getActiveAlerts() {
    return Array.from(this.alerts.values()).filter((a) => !a.resolvedAt);
  }

  getAlertsByName(name: string) {
    return Array.from(this.alerts.values()).filter((a) => a.name === name);
  }
}

/**
 * Performance Analyzer
 */
class PerformanceAnalyzer {
  analyzePerformanceData(data: Record<string, unknown>) {
    const insights: string[] = [];

    // Analyze latency trends
    if (data.p95_latency && (data.p95_latency as number) > 1000) {
      insights.push('P95 latency is elevated. Consider scaling or optimizing slow queries.');
    }

    // Analyze error rates
    if (data.error_rate && (data.error_rate as number) > 0.05) {
      insights.push('Error rate is above 5%. Check application logs for errors.');
    }

    // Analyze resource usage
    if (data.cpu_usage && (data.cpu_usage as number) > 0.8) {
      insights.push('CPU usage is high. Consider horizontal scaling.');
    }

    if (data.memory_usage && (data.memory_usage as number) > 0.85) {
      insights.push('Memory usage is high. Check for memory leaks.');
    }

    return insights;
  }

  detectRegressions(
    currentMetrics: Record<string, number>,
    baselineMetrics: Record<string, number>
  ) {
    const regressions: string[] = [];

    Object.entries(currentMetrics).forEach(([key, currentValue]) => {
      const baselineValue = baselineMetrics[key];
      if (baselineValue) {
        const percentChange = ((currentValue - baselineValue) / baselineValue) * 100;
        if (percentChange > 10) {
          regressions.push(`${key} increased by ${percentChange.toFixed(2)}%`);
        }
      }
    });

    return regressions;
  }
}

/**
 * Initialize Express app
 */
function createApp() {
  const app: Express = express();
  const incidentManager = new IncidentManager();
  const alertManager = new AlertManager(incidentManager);
  const performanceAnalyzer = new PerformanceAnalyzer();

  app.use(express.json());

  // Prometheus metrics middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();

    res.on('finish', () => {
      const duration = (Date.now() - startTime) / 1000;
      httpRequestDuration.observe(
        {
          method: req.method,
          route: req.route?.path || req.path,
          status_code: res.statusCode,
        },
        duration
      );

      httpRequestsTotal.inc({
        method: req.method,
        route: req.route?.path || req.path,
        status_code: res.statusCode,
      });

      if (res.statusCode >= 400) {
        httpErrorsTotal.inc({
          method: req.method,
          route: req.route?.path || req.path,
          error_type: res.statusCode >= 500 ? 'server_error' : 'client_error',
        });
      }
    });

    next();
  });

  // Health check endpoint
  app.get('/health', (req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // Prometheus metrics endpoint
  app.get('/metrics', async (req: Request, res: Response) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  });

  // Alert endpoints
  app.post('/alerts', (req: Request, res: Response) => {
    const { name, severity, message, metadata } = req.body;
    const alert = alertManager.fireAlert(name, severity, message, metadata || {});
    res.status(201).json(alert);
  });

  app.get('/alerts', (req: Request, res: Response) => {
    const alerts = alertManager.getActiveAlerts();
    res.json(alerts);
  });

  app.get('/alerts/:id', (req: Request, res: Response) => {
    const alert = alertManager.getAlert(req.params.id);
    if (!alert) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    res.json(alert);
  });

  app.post('/alerts/:id/resolve', (req: Request, res: Response) => {
    alertManager.resolveAlert(req.params.id);
    res.json({ status: 'resolved' });
  });

  // Incident endpoints
  app.get('/incidents', (req: Request, res: Response) => {
    const incidents = incidentManager.getActiveIncidents();
    res.json(incidents);
  });

  app.get('/incidents/:id', (req: Request, res: Response) => {
    const incident = incidentManager.getIncident(req.params.id);
    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }
    res.json(incident);
  });

  app.post('/incidents/:id/acknowledge', (req: Request, res: Response) => {
    incidentManager.acknowledgeIncident(req.params.id);
    res.json({ status: 'acknowledged' });
  });

  app.post('/incidents/:id/resolve', (req: Request, res: Response) => {
    incidentManager.resolveIncident(req.params.id);
    res.json({ status: 'resolved' });
  });

  // Performance analysis endpoints
  app.post('/analyze/performance', (req: Request, res: Response) => {
    const { data } = req.body;
    const insights = performanceAnalyzer.analyzePerformanceData(data || {});
    res.json({ insights });
  });

  app.post('/analyze/regressions', (req: Request, res: Response) => {
    const { current, baseline } = req.body;
    const regressions = performanceAnalyzer.detectRegressions(current || {}, baseline || {});
    res.json({ regressions, hasRegressions: regressions.length > 0 });
  });

  // Error handling middleware
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error('Unhandled error', {
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    });

    res.status(500).json({
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  });

  return app;
}

/**
 * Start server
 */
function startServer() {
  const app = createApp();
  const port = process.env.PORT || 8080;

  const server = app.listen(port, () => {
    logger.info(`Monitoring service started on port ${port}`);
    logger.info('Metrics endpoint: /metrics');
    logger.info('Health endpoint: /health');
  });

  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    server.close(() => {
      logger.info('Monitoring service stopped');
      process.exit(0);
    });
  });
}

export { IncidentManager, AlertManager, PerformanceAnalyzer, logger };

// Start server if this is the main module
if (require.main === module) {
  startServer();
}
