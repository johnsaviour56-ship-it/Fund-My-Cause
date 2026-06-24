#!/bin/bash

# Monitoring Infrastructure Setup Script
# Sets up comprehensive observability stack for Fund My Cause

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
MONITORING_DIR="$PROJECT_ROOT/infrastructure/monitoring"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Log functions
log_info() {
  echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
  echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
  echo -e "${RED}✗${NC} $1"
}

# Check prerequisites
check_prerequisites() {
  log_info "Checking prerequisites..."

  if ! command -v docker &> /dev/null; then
    log_error "Docker is not installed"
    exit 1
  fi
  log_success "Docker is installed"

  if ! command -v docker-compose &> /dev/null; then
    log_error "Docker Compose is not installed"
    exit 1
  fi
  log_success "Docker Compose is installed"

  if ! command -v node &> /dev/null; then
    log_error "Node.js is not installed"
    exit 1
  fi
  log_success "Node.js is installed"
}

# Setup environment variables
setup_environment() {
  log_info "Setting up environment variables..."

  if [ ! -f "$PROJECT_ROOT/.env.monitoring" ]; then
    cat > "$PROJECT_ROOT/.env.monitoring" << EOF
# OpenTelemetry Configuration
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
OTEL_EXPORTER_OTLP_HEADERS=
OTEL_SERVICE_NAME=fund-my-cause
OTEL_SERVICE_VERSION=1.0.0

# PagerDuty Configuration
PAGERDUTY_API_KEY=
PAGERDUTY_INTEGRATION_KEY=
PAGERDUTY_SERVICE_KEY=
PAGERDUTY_DEFI_SERVICE_KEY=

# Slack Configuration
SLACK_WEBHOOK_URL=
SLACK_CHANNEL=#alerts

# Grafana Configuration
GF_SECURITY_ADMIN_PASSWORD=admin
GF_SECURITY_ADMIN_USER=admin

# Monitoring Configuration
LOG_LEVEL=info
NODE_ENV=production
EOF
    log_success "Created .env.monitoring file"
    log_warning "Please update .env.monitoring with your credentials"
  else
    log_success ".env.monitoring already exists"
  fi
}

# Start monitoring stack
start_monitoring_stack() {
  log_info "Starting monitoring stack..."

  cd "$MONITORING_DIR"

  # Load environment variables
  if [ -f "$PROJECT_ROOT/.env.monitoring" ]; then
    set -a
    source "$PROJECT_ROOT/.env.monitoring"
    set +a
  fi

  # Start containers
  docker-compose up -d

  log_success "Monitoring stack started"

  # Wait for services to be ready
  log_info "Waiting for services to be ready..."
  sleep 10

  # Check health
  check_monitoring_health
}

# Check monitoring health
check_monitoring_health() {
  log_info "Checking monitoring stack health..."

  # Check Jaeger
  if curl -sf http://localhost:16686 > /dev/null; then
    log_success "Jaeger is running (http://localhost:16686)"
  else
    log_warning "Jaeger is not responding"
  fi

  # Check Prometheus
  if curl -sf http://localhost:9090 > /dev/null; then
    log_success "Prometheus is running (http://localhost:9090)"
  else
    log_warning "Prometheus is not responding"
  fi

  # Check Grafana
  if curl -sf http://localhost:3000 > /dev/null; then
    log_success "Grafana is running (http://localhost:3000)"
  else
    log_warning "Grafana is not responding"
  fi

  # Check AlertManager
  if curl -sf http://localhost:9093 > /dev/null; then
    log_success "AlertManager is running (http://localhost:9093)"
  else
    log_warning "AlertManager is not responding"
  fi

  # Check OpenTelemetry Collector
  if curl -sf http://localhost:13133/health/status > /dev/null; then
    log_success "OpenTelemetry Collector is running"
  else
    log_warning "OpenTelemetry Collector is not responding"
  fi
}

# Setup Grafana dashboards
setup_grafana_dashboards() {
  log_info "Setting up Grafana dashboards..."

  # Wait for Grafana to be ready
  sleep 5

  # Add Prometheus datasource
  curl -X POST http://localhost:3000/api/datasources \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Prometheus",
      "type": "prometheus",
      "url": "http://prometheus:9090",
      "access": "proxy",
      "isDefault": true
    }' \
    -u "admin:admin" 2>/dev/null || log_warning "Failed to add Prometheus datasource"

  log_success "Grafana dashboards configured"
}

# Setup monitoring services
setup_monitoring_services() {
  log_info "Setting up monitoring service packages..."

  cd "$PROJECT_ROOT/services/monitoring-service"

  # Install dependencies
  if [ -f "package.json" ]; then
    npm install
    log_success "Monitoring service dependencies installed"
  fi
}

# Create test alerts
create_test_alerts() {
  log_info "Creating test alerts..."

  # Wait for monitoring service to start
  sleep 5

  # Trigger a test alert
  curl -X POST http://localhost:8080/alerts \
    -H "Content-Type: application/json" \
    -d '{
      "name": "TestAlert",
      "severity": "info",
      "message": "Monitoring stack test alert",
      "metadata": {
        "test": true,
        "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"
      }
    }' 2>/dev/null || log_warning "Failed to create test alert"

  log_success "Test alert created"
}

# Display summary
display_summary() {
  echo ""
  log_info "Monitoring Stack Setup Complete!"
  echo ""
  echo "Available endpoints:"
  echo "  • Jaeger UI: http://localhost:16686"
  echo "  • Prometheus: http://localhost:9090"
  echo "  • Grafana: http://localhost:3000 (admin/admin)"
  echo "  • AlertManager: http://localhost:9093"
  echo "  • Monitoring Service: http://localhost:8080"
  echo ""
  echo "Documentation:"
  echo "  • Jaeger Documentation: https://www.jaegertracing.io/"
  echo "  • Prometheus Documentation: https://prometheus.io/docs/"
  echo "  • Grafana Documentation: https://grafana.com/docs/"
  echo ""
  echo "Next steps:"
  echo "  1. Update .env.monitoring with your PagerDuty and Slack credentials"
  echo "  2. Import dashboards in Grafana"
  echo "  3. Configure alert rules in Prometheus"
  echo "  4. Set up incident response workflows"
  echo ""
}

# Stop monitoring stack
stop_monitoring_stack() {
  log_info "Stopping monitoring stack..."

  cd "$MONITORING_DIR"
  docker-compose down

  log_success "Monitoring stack stopped"
}

# Main execution
main() {
  case "${1:-start}" in
    start)
      check_prerequisites
      setup_environment
      start_monitoring_stack
      setup_grafana_dashboards
      setup_monitoring_services
      create_test_alerts
      display_summary
      ;;
    stop)
      stop_monitoring_stack
      ;;
    restart)
      stop_monitoring_stack
      sleep 2
      check_prerequisites
      start_monitoring_stack
      display_summary
      ;;
    status)
      check_monitoring_health
      ;;
    *)
      echo "Usage: $0 {start|stop|restart|status}"
      exit 1
      ;;
  esac
}

main "$@"
