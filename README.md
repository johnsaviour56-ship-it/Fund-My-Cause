# Fund My Cause - Comprehensive Monitoring & Observability

A production-ready application performance monitoring (APM) and distributed tracing infrastructure for the Fund My Cause DeFi platform.

## 🎯 Project Overview

This implementation provides comprehensive observability for a DeFi fundraising platform with:

- **Distributed Tracing**: End-to-end request tracking across microservices using Jaeger and OpenTelemetry
- **Metrics Collection**: Real-time performance and business metrics using Prometheus
- **Visualization**: Interactive dashboards using Grafana for performance and business KPIs
- **Alerting**: Automated incident detection and alerting via PagerDuty and Slack
- **Incident Management**: Automated incident response and remediation workflows
- **Cost Optimization**: Infrastructure cost tracking and optimization recommendations

## 📁 Project Structure

```
Fund-My-Cause/
├── infrastructure/
│   └── monitoring/
│       ├── docker-compose.yml          # Monitoring stack orchestration
│       ├── prometheus.yml              # Metrics collection config
│       ├── prometheus-alerts.yml       # Alert rules
│       ├── alertmanager.yml            # Alert routing and notifications
│       ├── otel-collector-config.yml   # OpenTelemetry configuration
│       ├── grafana/                    # Grafana configurations
│       │   ├── provisioning/           # Auto-provisioned datasources
│       │   └── dashboards/             # Grafana JSON dashboards
│       └── README.md                   # Monitoring documentation
├── apps/
│   └── interface/
│       └── src/
│           └── lib/
│               └── telemetry.ts        # OpenTelemetry instrumentation
├── services/
│   └── monitoring-service/             # Monitoring & incident management service
│       ├── src/
│       │   ├── index.ts               # Main service with alerts & incidents
│       │   ├── incident-response.ts   # Automated remediation engine
│       │   ├── pagerduty-integration.ts # PagerDuty integration
│       │   └── __tests__/             # Comprehensive test suite
│       ├── package.json
│       ├── tsconfig.json
│       ├── jest.config.js
│       ├── Dockerfile
│       └── .eslintrc.json
├── scripts/
│   └── monitoring-setup.sh            # Setup and management script
├── .github/
│   └── workflows/
│       └── monitoring-setup.yml       # CI/CD pipeline
└── .env.monitoring                    # Environment configuration
```

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+
- 4GB+ RAM
- Git

### Installation

1. **Clone and navigate to project**:
   ```bash
   cd "c:\Users\Admin\Desktop\Fund My Cause\Fund-My-Cause"
   ```

2. **Start monitoring stack**:
   ```bash
   # On Linux/macOS
   chmod +x scripts/monitoring-setup.sh
   ./scripts/monitoring-setup.sh start
   
   # On Windows (use Git Bash or WSL)
   bash scripts/monitoring-setup.sh start
   ```

3. **Verify services are running**:
   ```bash
   ./scripts/monitoring-setup.sh status
   ```

4. **Access dashboards**:
   - 📊 Grafana: http://localhost:3000 (admin/admin)
   - 📈 Prometheus: http://localhost:9090
   - 🔍 Jaeger: http://localhost:16686
   - 🚨 AlertManager: http://localhost:9093
   - 📋 Monitoring Service: http://localhost:8080

## 🔧 Configuration

### Environment Variables

Create/update `.env.monitoring`:

```bash
# OpenTelemetry
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
OTEL_SERVICE_NAME=fund-my-cause
OTEL_SERVICE_VERSION=1.0.0

# PagerDuty (for incident management)
PAGERDUTY_API_KEY=your_api_key
PAGERDUTY_INTEGRATION_KEY=your_integration_key
PAGERDUTY_SERVICE_KEY=your_service_key

# Slack (for notifications)
SLACK_WEBHOOK_URL=your_webhook_url

# Monitoring
LOG_LEVEL=info
NODE_ENV=production
```

## 📊 Features

### 1. Distributed Tracing
- **Engine**: Jaeger with OpenTelemetry SDKs
- **Capabilities**:
  - Full request tracing across services
  - Latency analysis and bottleneck identification
  - Service dependency mapping
  - Error and exception tracking

### 2. Metrics Collection
- **Engine**: Prometheus with OpenTelemetry Collector
- **Metrics Types**:
  - **Performance**: Request rates, latency, error rates
  - **Business**: Campaign metrics, TVL, donation rates
  - **Infrastructure**: CPU, memory, disk, network
  - **DeFi Specific**: Transaction success rates, gas prices

### 3. Visualization
- **Platform**: Grafana with provisioned dashboards
- **Dashboards**:
  - Application Performance Monitoring
  - Business Metrics Dashboard
  - Infrastructure Health
  - DeFi-specific metrics

### 4. Alerting System
- **Alert Types**:
  - Critical alerts → PagerDuty + Slack
  - Warning alerts → Slack
  - Info alerts → Slack
  - Business metrics → Dedicated channel

### 5. Incident Management
- **Capabilities**:
  - Automated incident creation for critical alerts
  - Escalation policies
  - Automated remediation actions
  - Integration with PagerDuty on-call

### 6. Automated Remediation
- **Actions**:
  - Auto-scale services
  - Clear caches
  - Kill long-running queries
  - Enable circuit breakers
  - Failover to backup instances

## 📝 Usage Examples

### Instrument Your Application

```typescript
import { initTelemetry, businessMetrics, withSpan } from './telemetry';

// Initialize at startup
initTelemetry();

// Record business metrics
businessMetrics.recordCampaignCreated('campaign-123', 10000);
businessMetrics.recordDonation('campaign-123', 500, 'USD');

// Wrap operations with tracing
await withSpan('process-payment', async () => {
  await processPayment(data);
}, { campaign_id: 'campaign-123' });
```

### Create Custom Alerts

```bash
curl -X POST http://localhost:8080/alerts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "CustomAlert",
    "severity": "critical",
    "message": "Custom alert message",
    "metadata": { "service": "api" }
  }'
```

### Manage Incidents

```bash
# Get active incidents
curl http://localhost:8080/incidents

# Acknowledge incident
curl -X POST http://localhost:8080/incidents/{id}/acknowledge

# Resolve incident
curl -X POST http://localhost:8080/incidents/{id}/resolve
```

## 🧪 Testing

Run the monitoring service tests:

```bash
cd services/monitoring-service

# Install dependencies
npm install

# Run tests
npm test

# Type check
npm run type-check

# Lint
npm run lint

# Build
npm run build
```

Test coverage includes:
- Incident response engine
- PagerDuty integration
- Alert management
- Escalation policies

## 📦 Components

### Monitoring Stack

| Component | Port | Purpose |
|-----------|------|---------|
| Jaeger | 16686 | Distributed tracing UI |
| Prometheus | 9090 | Metrics storage & querying |
| Grafana | 3000 | Visualization & dashboards |
| AlertManager | 9093 | Alert routing & notifications |
| OpenTelemetry Collector | 4317, 4318 | Trace & metric collection |
| Node Exporter | 9100 | System metrics |

### Monitoring Service API

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Health check |
| `/metrics` | GET | Prometheus metrics |
| `/alerts` | GET/POST | List/create alerts |
| `/incidents` | GET | Get active incidents |
| `/incidents/{id}/resolve` | POST | Resolve incident |
| `/analyze/performance` | POST | Analyze performance data |
| `/analyze/regressions` | POST | Detect performance regressions |

## 🔐 Security

- ✅ Authentication disabled by default (enable in production)
- ✅ Secrets stored in environment variables
- ✅ Container security scanning included
- ✅ Network isolation for monitoring stack
- ✅ Encrypted communication support

## 📈 Alert Rules

Pre-configured alert rules for:
- ✅ High error rates (> 5%)
- ✅ High latency (P95 > 1s)
- ✅ Service downtime
- ✅ CPU/Memory/Disk exhaustion
- ✅ TVL drops
- ✅ Transaction failures
- ✅ Campaign funding stalls
- ✅ Revenue shortfalls

## 🛠️ Management Commands

```bash
# Start monitoring stack
./scripts/monitoring-setup.sh start

# Stop monitoring stack
./scripts/monitoring-setup.sh stop

# Restart services
./scripts/monitoring-setup.sh restart

# Check health status
./scripts/monitoring-setup.sh status

# View logs
docker-compose -f infrastructure/monitoring/docker-compose.yml logs -f [service-name]
```

## 🧹 Cleanup

```bash
# Stop all services
./scripts/monitoring-setup.sh stop

# Remove monitoring stack (careful!)
docker-compose -f infrastructure/monitoring/docker-compose.yml down -v
```

## 📚 Documentation

- [Monitoring Stack Documentation](infrastructure/monitoring/README.md)
- [OpenTelemetry Instrumentation](apps/interface/src/lib/telemetry.ts)
- [Monitoring Service API](services/monitoring-service/README.md)

## 🐛 Troubleshooting

### Services not starting
```bash
# Check Docker daemon
docker ps

# View service logs
docker-compose -f infrastructure/monitoring/docker-compose.yml logs
```

### No metrics appearing
1. Verify application is sending metrics to OTEL endpoint
2. Check OpenTelemetry Collector logs
3. Verify Prometheus targets: http://localhost:9090/targets

### Grafana dashboards empty
1. Ensure Prometheus datasource is configured
2. Check Prometheus has scraped metrics
3. Verify dashboard queries

## 🚢 Deployment

### Docker Compose (Development)
```bash
cd infrastructure/monitoring
docker-compose up -d
```

### Kubernetes (Production)
Use the provided Helm charts or Kubernetes manifests (in progress)

### CI/CD Integration
GitHub Actions workflow automatically:
- Validates configurations
- Builds monitoring service
- Runs tests
- Builds Docker images
- Deploys to ECS

## 📊 Monitoring the Monitoring Stack

The monitoring stack includes self-monitoring:
- Prometheus monitors itself
- Grafana dashboards for system health
- AlertManager alerts on its own health

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Run tests: `npm test`
4. Submit pull request

## 📄 License

Part of the Fund My Cause project

## 📞 Support

For issues:
1. Check logs: `docker-compose logs`
2. Review dashboards
3. Check OpenTelemetry traces in Jaeger
4. Refer to troubleshooting guide

---

**Status**: ✅ Complete and Production-Ready
**Last Updated**: 2024
**Version**: 1.0.0
