/**
 * OpenTelemetry Instrumentation and Configuration
 * Provides comprehensive observability for the Fund My Cause application
 * Includes distributed tracing, metrics, and logging
 */

import {
  NodeTracerProvider,
  ConsoleSpanExporter,
  SimpleSpanProcessor,
  BatchSpanProcessor,
} from '@opentelemetry/node';
import {
  MeterProvider,
  ConsoleMetricExporter,
  IntervalMetricApproximation,
  PeriodicExportingMetricReader,
} from '@opentelemetry/sdk-metrics-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-grpc';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg';
import { RedisInstrumentation } from '@opentelemetry/instrumentation-redis';
import { MongoDBInstrumentation } from '@opentelemetry/instrumentation-mongodb';
import { trace, context, metrics, SpanStatusCode, Attributes } from '@opentelemetry/api';
import { registerInstrumentations } from '@opentelemetry/instrumentation-auto';

/**
 * Initialize OpenTelemetry
 */
export function initTelemetry() {
  const environment = process.env.NODE_ENV || 'development';
  const serviceName = process.env.SERVICE_NAME || 'fund-my-cause-api';
  const serviceVersion = process.env.SERVICE_VERSION || '1.0.0';
  const otelEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4317';

  // Create a resource
  const resource = Resource.default().merge(
    new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
      [SemanticResourceAttributes.SERVICE_VERSION]: serviceVersion,
      environment,
      deploymentEnvironment: environment,
    })
  );

  // Tracer Provider Setup
  const tracerProvider = new NodeTracerProvider({ resource });

  // Export traces in development to console
  if (environment === 'development') {
    tracerProvider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()));
  }

  // Export traces to OTLP collector in production
  const otlpTraceExporter = new OTLPTraceExporter({
    url: `${otelEndpoint}/v1/traces`,
  });
  tracerProvider.addSpanProcessor(new BatchSpanProcessor(otlpTraceExporter));

  // Register trace context propagation
  tracerProvider.register();

  // Metrics Provider Setup
  const metricReader = new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({
      url: `${otelEndpoint}/v1/metrics`,
    }),
    intervalMillis: 10000, // 10 seconds
  });

  const meterProvider = new MeterProvider({
    resource,
    readers: [metricReader],
  });

  // In development, also export to console
  if (environment === 'development') {
    const consoleMetricReader = new PeriodicExportingMetricReader({
      exporter: new ConsoleMetricExporter(),
      intervalMillis: 30000,
    });
    meterProvider.addMetricReader(consoleMetricReader);
  }

  // Register auto-instrumentation
  registerInstrumentations();

  // Register manual instrumentations
  registerInstrumentations({
    instrumentations: [
      new HttpInstrumentation(),
      new ExpressInstrumentation(),
      new PgInstrumentation(),
      new RedisInstrumentation(),
      new MongoDBInstrumentation(),
    ],
  });

  // Set as global providers
  metrics.setGlobalMeterProvider(meterProvider);

  console.log(`✓ Telemetry initialized for ${serviceName} (${environment})`);
  console.log(`  OTEL Endpoint: ${otelEndpoint}`);
}

/**
 * Get global tracer instance
 */
export const getTracer = (name?: string) => {
  return trace.getTracer(name || 'default-tracer');
};

/**
 * Get global meter instance
 */
export const getMeter = (name?: string) => {
  return metrics.getMeter(name || 'default-meter');
};

/**
 * Wrap async function with tracing
 */
export async function withSpan<T>(
  name: string,
  fn: () => Promise<T>,
  attributes?: Attributes
): Promise<T> {
  const tracer = getTracer();
  return tracer.startActiveSpan(name, async (span) => {
    try {
      if (attributes) {
        span.setAttributes(attributes);
      }
      const result = await fn();
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: SpanStatusCode.ERROR });
      throw error;
    } finally {
      span.end();
    }
  });
}

/**
 * Wrap sync function with tracing
 */
export function withSpanSync<T>(
  name: string,
  fn: () => T,
  attributes?: Attributes
): T {
  const tracer = getTracer();
  return tracer.startActiveSpan(name, (span) => {
    try {
      if (attributes) {
        span.setAttributes(attributes);
      }
      const result = fn();
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: SpanStatusCode.ERROR });
      throw error;
    } finally {
      span.end();
    }
  });
}

/**
 * Create and record business metrics
 */
export class BusinessMetrics {
  private meter = getMeter('business-metrics');

  // Campaign metrics
  campaignCounter = this.meter.createCounter('campaign_total_created', {
    description: 'Total number of campaigns created',
  });

  campaignDonationCounter = this.meter.createCounter('campaign_donations_total', {
    description: 'Total campaign donations',
  });

  campaignSuccessCounter = this.meter.createCounter('campaign_success_total', {
    description: 'Total successful campaigns',
  });

  campaignTVLGauge = this.meter.createUpDownCounter('tvl_total', {
    description: 'Total Value Locked in campaigns',
  });

  // User metrics
  userSignupCounter = this.meter.createCounter('new_user_signups_total', {
    description: 'Total new user signups',
  });

  activeUsersGauge = this.meter.createObservableGauge('users_active', {
    description: 'Number of active users',
  });

  // Transaction metrics
  transactionCounter = this.meter.createCounter('blockchain_transactions_total', {
    description: 'Total blockchain transactions',
  });

  transactionFailureCounter = this.meter.createCounter('blockchain_transaction_failures_total', {
    description: 'Failed blockchain transactions',
  });

  // Recording methods
  recordCampaignCreated(campaignId: string, targetAmount: number) {
    this.campaignCounter.add(1, {
      campaign_id: campaignId,
      target_amount: targetAmount,
    });
  }

  recordDonation(campaignId: string, amount: number, currency: string) {
    this.campaignDonationCounter.add(1, {
      campaign_id: campaignId,
      amount,
      currency,
    });
    this.campaignTVLGauge.add(amount, {
      campaign_id: campaignId,
      currency,
    });
  }

  recordCampaignSuccess(campaignId: string, finalAmount: number) {
    this.campaignSuccessCounter.add(1, {
      campaign_id: campaignId,
      final_amount: finalAmount,
    });
  }

  recordUserSignup(userId: string, source: string) {
    this.userSignupCounter.add(1, {
      user_id: userId,
      source,
    });
  }

  recordTransaction(txHash: string, type: string, blockchain: string, status: 'success' | 'failed') {
    this.transactionCounter.add(1, {
      tx_hash: txHash,
      type,
      blockchain,
    });

    if (status === 'failed') {
      this.transactionFailureCounter.add(1, {
        tx_hash: txHash,
        type,
        blockchain,
      });
    }
  }
}

/**
 * Application performance metrics
 */
export class PerformanceMetrics {
  private meter = getMeter('performance-metrics');

  requestDurationHistogram = this.meter.createHistogram('http_request_duration_seconds', {
    description: 'HTTP request duration in seconds',
  });

  requestCounter = this.meter.createCounter('http_requests_total', {
    description: 'Total HTTP requests',
  });

  errorCounter = this.meter.createCounter('http_errors_total', {
    description: 'Total HTTP errors',
  });

  databaseQueryDuration = this.meter.createHistogram('db_query_duration_seconds', {
    description: 'Database query duration in seconds',
  });

  cacheHitCounter = this.meter.createCounter('cache_hits_total', {
    description: 'Total cache hits',
  });

  cacheMissCounter = this.meter.createCounter('cache_misses_total', {
    description: 'Total cache misses',
  });

  // Recording methods
  recordHttpRequest(method: string, path: string, statusCode: number, duration: number) {
    this.requestCounter.add(1, {
      method,
      path,
      status: statusCode,
    });

    this.requestDurationHistogram.record(duration, {
      method,
      path,
      status: statusCode,
    });

    if (statusCode >= 400) {
      this.errorCounter.add(1, {
        method,
        path,
        status: statusCode,
      });
    }
  }

  recordDatabaseQuery(operation: string, table: string, duration: number, success: boolean) {
    this.databaseQueryDuration.record(duration, {
      operation,
      table,
      success,
    });
  }

  recordCacheHit(key: string) {
    this.cacheHitCounter.add(1, { key });
  }

  recordCacheMiss(key: string) {
    this.cacheMissCounter.add(1, { key });
  }
}

/**
 * Cost optimization tracking
 */
export class CostMetrics {
  private meter = getMeter('cost-metrics');

  computeCostCounter = this.meter.createCounter('cost_compute_total', {
    description: 'Total compute costs',
  });

  storageCostCounter = this.meter.createCounter('cost_storage_total', {
    description: 'Total storage costs',
  });

  bandwidthCostCounter = this.meter.createCounter('cost_bandwidth_total', {
    description: 'Total bandwidth costs',
  });

  // Recording methods
  recordComputeCost(service: string, amount: number) {
    this.computeCostCounter.add(amount, { service });
  }

  recordStorageCost(service: string, amount: number) {
    this.storageCostCounter.add(amount, { service });
  }

  recordBandwidthCost(service: string, amount: number) {
    this.bandwidthCostCounter.add(amount, { service });
  }
}

// Export singleton instances
export const businessMetrics = new BusinessMetrics();
export const performanceMetrics = new PerformanceMetrics();
export const costMetrics = new CostMetrics();
