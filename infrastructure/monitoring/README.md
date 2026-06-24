# Fund My Cause - Monitoring & Observability Stack

Comprehensive application performance monitoring (APM) and distributed tracing infrastructure for the Fund My Cause DeFi platform.

## Overview

This monitoring stack provides:

- **Distributed Tracing**: End-to-end request tracing across all services
- **Metrics Collection**: Real-time performance metrics and business KPIs
- **Visualization**: Interactive dashboards for performance and business metrics
- **Alerting**: Automated incident detection and response
- **Incident Management**: Integrated with PagerDuty for on-call management
- **Cost Optimization**: Track and optimize infrastructure costs

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Application Services                        │
│  (API, Campaign Service, Payment Processor, Blockchain Indexer) │
└────────────┬────────────┬────────────┬────────────┬──────────────┘
             │            │            │            │
             └─────────────┴────────────┴────────────┘
                          │
                  ┌───────▼────────┐
                  │  OpenTelemetry │
                  │   Collector    │
                  └───────┬────────┘
         ┌────────────────┼────────────────┐
         │                │                │
    ┌────▼────┐      ┌───▼──────┐    ┌───▼──────┐
    │  Jaeger  │      │Prometheus│    │ Log      │
    │(Tracing) │      │(Metrics) │    │Aggregator│
    └────┬─────┘      └───┬──────┘    └───┬──────┘
         │                │                │
         │          ┌──────▼──────┐        │
         │          │   Grafana   │        │
         │          │ Dashboards  │        │
         │          └──────┬──────┘        │
         │                 │               │
         │          ┌──────▼──────┐        │
         │          │AlertManager │◄───────┘
         │          └──────┬──────┘
         │                 │
         └─────────┬───────┴─────────┐
                   │                 │
            ┌──────▼────────┐  ┌────▼─────────┐
            │   PagerDuty   │  │ Slack/Webhooks
            │(Incidents)    │  │(Notifications)
            └───────────────┘  └────────────────┘
```

## Stack Components

### 1. OpenTelemetry Collector
- **Port**: 4317 (gRPC), 4318 (HTTP)
- **Role**: Receives traces and metrics from applications
- **Features**: 
  - Spans processing and filtering
  - Metrics transformation
  - Multiple exporters support

### 2. Jaeger
- **Port**: 16686 (UI), 14250 (gRPC), 14268 (HTTP)
- **Role**: Distributed tracing backend
- **Features**:
  - Request flow visualization
  - Latency analysis
  - Service dependencies
  - Error tracking

### 3. Prometheus
- **Port**: 9090
- **Role**: Time-series metrics storage
- **Features**:
  - Metrics scraping
  - Alert rule evaluation
  - Data retention (15 days default)

### 4. Grafana
- **Port**: 3000
- **Role**: Metrics visualization and dashboarding
- **Features**:
  - Real-time dashboards
  - Alert management UI
  - Alerting integration
  - Multi-datasource support

### 5. AlertManager
- **Port**: 9093
- **Role**: Alert aggregation and routing
- **Features**:
  - Alert deduplication
  - Grouping and silencing
  - Multi-channel notifications

### 6. Monitoring Service
- **Port**: 8080
- **Role**: Centralized monitoring and incident management
- **Features**:
  - Incident tracking
  - Alert management
  - Performance analysis
  - Automated remediation

## Getting Started

### Prerequisites

- Docker & Docker Compose
- Node.js 18+
- 4GB+ RAM available
- PagerDuty account (optional, for incident management)
- Slack workspace (optional, for notifications)

### Installation

1. **Start the monitoring stack**:
   ```bash
   cd scripts
   chmod +x monitoring-setup.sh
   ./monitoring-setup.sh start
   ```

2. **Verify services are running**:
   ```bash
   ./monitoring-setup.sh status
   ```

3. **Access the dashboards**:
   - Jaeger UI: http://localhost:16686
   - Prometheus: http://localhost:9090
   - Grafana: http://localhost:3000 (admin/admin)
   - AlertManager: http://localhost:9093

4. **Configure credentials**:
   ```bash
   # Edit .env.monitoring with your credentials
   nano .env.monitoring
   ```

### Environment Variables

```env
# OpenTelemetry Configuration
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
OTEL_SERVICE_NAME=fund-my-cause
OTEL_SERVICE_VERSION=1.0.0

# PagerDuty Configuration
PAGERDUTY_API_KEY=your_api_key
PAGERDUTY_INTEGRATION_KEY=your_integration_key
PAGERDUTY_SERVICE_KEY=your_service_key

# Slack Configuration
SLACK_WEBHOOK_URL=your_webhook_url
SLACK_CHANNEL=#alerts

# Grafana Configuration
GF_SECURITY_ADMIN_PASSWORD=admin

# Logging
LOG_LEVEL=info
NODE_ENV=production
```

## Application Integration

### TypeScript/Node.js

```typescript
import { initTelemetry, businessMetrics, performanceMetrics } from './telemetry';

// Initialize at application startup
initTelemetry();

// Record business metrics
businessMetrics.recordCampaignCreated('campaign-123', 10000);
businessMetrics.recordDonation('campaign-123', 500, 'USD');

// Record performance metrics
performanceMetrics.recordHttpRequest('POST', '/api/campaigns', 201, 0.125);
performanceMetrics.recordDatabaseQuery('SELECT', 'campaigns', 0.045, true);
```

### Using OpenTelemetry

```typescript
import { getTracer, withSpan } from './telemetry';

const tracer = getTracer('my-service');

// Wrap async operations
await withSpan('process-donation', async () => {
  const donation = await processDonation(data);
  return donation;
}, { campaign_id: 'campaign-123' });

// Manual span creation
const span = tracer.startSpan('fetch-user');
try {
  const user = await fetchUser(userId);
  span.setStatus({ code: SpanStatusCode.OK });
  return user;
} finally {
  span.end();
}
```

## Dashboards

### Application Performance
- Request rate and latency
- Error rates and types
- HTTP status distribution
- Service health overview

### Business Metrics
- Total Value Locked (TVL)
- Campaign success rates
- Donation volumes
- Active campaigns
- Contributor metrics

### Infrastructure
- CPU and memory usage
- Disk utilization
- Network I/O
- Container health

### DeFi Specific
- Transaction success rates
- Gas price monitoring
- Smart contract interactions
- Blockchain transaction latency

## Alert Rules

### Critical Alerts
- High error rate (> 5%)
- Service down
- TVL significant drop
- Transaction failure rate (> 10%)
- Smart contract errors

### Warning Alerts
- High latency (P95 > 1s)
- High resource usage
- Campaign funding stalled
- Gas price spike

### Info Alerts
- Low user signup rate
- Revenue shortfall
- Performance degradation

## Incident Management

### Automatic Incident Response

The system includes automatic remediation for common issues:

```typescript
import { 
  IncidentResponseEngine, 
  CommonRemediations 
} from 'incident-response';

const engine = new IncidentResponseEngine();

// Register remediation actions
engine.registerRemediation('HighCPUUsage', 
  CommonRemediations.scaleUpService('api-service')
);

engine.registerRemediation('DatabaseSlowQueries',
  CommonRemediations.killLongQueries('postgres', 300)
);

// Execute remediations when incident detected
await engine.executeRemediation('HighCPUUsage', context);
```

### PagerDuty Integration

```typescript
import { PagerDutyClient, PagerDutySeverity } from 'pagerduty-integration';

const pagerduty = new PagerDutyClient(apiKey, integrationKey);

// Trigger incident
await pagerduty.triggerIncident(
  serviceKey,
  'Critical error in payment processing',
  PagerDutySeverity.CRITICAL,
  { error: errorDetails }
);

// Acknowledge incident
await pagerduty.acknowledgeIncident(
  serviceKey,
  dedupKey,
  'Investigating issue'
);

// Resolve incident
await pagerduty.resolveIncident(
  serviceKey,
  dedupKey,
  'Issue resolved - cache cleared'
);
```

## Performance Analysis

The monitoring service includes automated performance analysis:

```typescript
const analyzer = new PerformanceAnalyzer();

// Analyze performance data
const insights = analyzer.analyzePerformanceData({
  p95_latency: 1250,
  error_rate: 0.08,
  cpu_usage: 0.85,
  memory_usage: 0.90
});
// Returns: ["P95 latency is elevated...", "Error rate is above 5%..."]

// Detect regressions
const regressions = analyzer.detectRegressions(
  currentMetrics,
  baselineMetrics
);
// Returns: ["response_time increased by 15%", ...]
```

## Cost Optimization

Track infrastructure costs by service:

```typescript
import { costMetrics } from './telemetry';

// Record costs
costMetrics.recordComputeCost('api-service', 125.50);
costMetrics.recordStorageCost('database', 45.25);
costMetrics.recordBandwidthCost('cdn', 32.75);

// Total daily cost: $203.50
```

Monitor trends and optimize:
- Right-size instances based on utilization
- Enable auto-scaling for variable workloads
- Implement caching to reduce compute

## Maintenance

### Updating the Stack

```bash
# Pull latest images
docker-compose pull

# Restart services
./monitoring-setup.sh restart
```

### Data Retention

Configure retention policies in `prometheus.yml`:
```yaml
global:
  scrape_interval: 15s

storage:
  tsdb:
    retention: 15d  # Adjust as needed
```

### Backing Up Data

```bash
# Backup Grafana dashboards
docker exec grafana grafana-cli admin export-dashboard

# Backup Prometheus data
docker cp prometheus:/prometheus ./prometheus-backup
```

### Cleanup

```bash
# Stop monitoring stack
./monitoring-setup.sh stop

# Remove volumes (careful!)
docker-compose down -v
```

## Troubleshooting

### Jaeger not receiving traces

1. Check OpenTelemetry Collector is running: `docker-compose logs otel-collector`
2. Verify application sends to correct endpoint: `OTEL_EXPORTER_OTLP_ENDPOINT`
3. Check firewall/network configuration

### Prometheus scrape failures

1. Verify services have `/metrics` endpoint
2. Check Prometheus targets: http://localhost:9090/targets
3. Review Prometheus logs: `docker-compose logs prometheus`

### Grafana datasource issues

1. Verify Prometheus is accessible from Grafana container
2. Check datasource configuration: Configuration → Data Sources
3. Test connection

### AlertManager issues

1. Verify alert rules are valid: `docker-compose exec prometheus cat /etc/prometheus/prometheus-alerts.yml`
2. Check AlertManager configuration: http://localhost:9093/#/status
3. Review logs: `docker-compose logs alertmanager`

## Performance Tuning

### Prometheus Optimization
```yaml
# Reduce scrape interval for less critical metrics
- job_name: 'info-service'
  scrape_interval: 60s
```

### Memory Limits
```yaml
services:
  prometheus:
    deploy:
      resources:
        limits:
          memory: 1G
```

### Storage Optimization
- Compress old data
- Implement data retention policies
- Use object storage for long-term archival

## Security Considerations

- **Authentication**: Enable Grafana/Prometheus authentication
- **Network**: Use VPN or private networks for monitoring stack
- **Credentials**: Use secrets manager for PagerDuty/Slack tokens
- **RBAC**: Implement role-based access control in Grafana
- **Encryption**: Enable TLS for external connections

## Best Practices

1. **Cardinality**: Keep label cardinality low to avoid explosion
2. **Sampling**: Use sampling in production to reduce volume
3. **Retention**: Balance detail vs. storage costs
4. **Alerting**: Test alert rules before deploying
5. **Documentation**: Keep runbooks for common incidents
6. **Automation**: Automate remediation where possible
7. **Regular Reviews**: Review dashboards and alerts monthly

## Useful Resources

- [OpenTelemetry Docs](https://opentelemetry.io/docs/)
- [Jaeger Documentation](https://www.jaegertracing.io/docs/)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [AlertManager Documentation](https://prometheus.io/docs/alerting/latest/alertmanager/)
- [PagerDuty API](https://developer.pagerduty.com/)

## Support

For issues or questions:
1. Check application logs
2. Review monitoring dashboards
3. Check Jaeger traces for errors
4. Consult troubleshooting section

## License

Part of the Fund My Cause project
