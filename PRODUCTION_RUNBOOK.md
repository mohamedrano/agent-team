# Production Runbook - Agent Team Platform
## الدليل التشغيلي للإنتاج

**Last Updated**: 2025-10-21  
**Version**: 1.0.0  
**Owner**: Platform Engineering Team

---

## 📋 Table of Contents

1. [Critical Environment Variables](#critical-environment-variables)
2. [QPS Limits & Rate Limiting](#qps-limits--rate-limiting)
3. [Fallback Behavior](#fallback-behavior)
4. [Health Checks & Monitoring](#health-checks--monitoring)
5. [Incident Response](#incident-response)
6. [Deployment Procedures](#deployment-procedures)
7. [Backup & Recovery](#backup--recovery)
8. [Security Considerations](#security-considerations)

---

## 🔐 Critical Environment Variables

### Required Variables

These variables **MUST** be set in production:

```bash
# ═══════════════════════════════════════════════════════════
# HTTP Server Configuration
# ═══════════════════════════════════════════════════════════
PORT=8080                          # Server port
HOST=0.0.0.0                       # Bind address
NODE_ENV=production                # Environment mode

# ═══════════════════════════════════════════════════════════
# AI Configuration
# ═══════════════════════════════════════════════════════════
GEMINI_API_KEY=<REQUIRED>          # Google Gemini API key
AI_MODEL_DEFAULT=gemini-2.5-pro    # Default model for generation
AI_TEMPERATURE=0.2                  # Generation temperature (0.0-1.0)
AI_MAX_TOKENS=4096                  # Max output tokens
AI_RATE_QPS=3                       # Queries per second limit

# ═══════════════════════════════════════════════════════════
# Communication Security
# ═══════════════════════════════════════════════════════════
COMM_HMAC_ACTIVE_KEY_ID=prod-v1    # Active HMAC key ID
COMM_HMAC_DEFAULT_SECRET=<REQUIRED> # HMAC signing secret (min 32 chars)
COMM_QOS=at-least-once              # Message QoS level
COMM_IDEMPOTENCY_TTL_SEC=86400     # Idempotency TTL (24 hours)

# ═══════════════════════════════════════════════════════════
# Orchestration Configuration
# ═══════════════════════════════════════════════════════════
ORCH_ENABLED=true                   # Enable orchestration layer
ORCH_MAX_RETRIES=3                  # Max retry attempts per step

# ═══════════════════════════════════════════════════════════
# Message Bus (Production: Redis or Pub/Sub)
# ═══════════════════════════════════════════════════════════
AGENT_BUS_PROVIDER=redis           # Options: memory, redis, pubsub
REDIS_URL=redis://prod-redis:6379  # Redis connection URL

# ═══════════════════════════════════════════════════════════
# Database (Supabase/PostgreSQL)
# ═══════════════════════════════════════════════════════════
DATABASE_URL=<REQUIRED>             # PostgreSQL connection string
SUPABASE_URL=<REQUIRED>            # Supabase project URL
SUPABASE_SERVICE_ROLE_KEY=<REQUIRED> # Service role key for server

# ═══════════════════════════════════════════════════════════
# Observability
# ═══════════════════════════════════════════════════════════
LOG_LEVEL=info                      # Log level: debug, info, warn, error
SENTRY_DSN=<REQUIRED>              # Sentry error tracking DSN
SENTRY_ENVIRONMENT=production       # Environment tag
SENTRY_TRACES_SAMPLE_RATE=0.1      # APM sampling rate
```

### Optional but Recommended

```bash
# Performance & Limits
MAX_PAYLOAD_BYTES=524288            # 512KB max payload
DEFAULT_TOOL_TIMEOUT_MS=60000       # 60s tool timeout
MAX_CONCURRENT_PIPELINES=10         # Concurrent workflow limit

# Cloud Configuration
GCP_PROJECT_ID=<your-project>
GCP_LOCATION=us-central1
CLOUDFLARE_ZONE_ID=<your-zone>

# Feature Flags
ENABLE_DEBATE_MODE=true
ENABLE_CIRCUIT_BREAKER=true
ENABLE_RETRY_LOGIC=true
ENABLE_IDEMPOTENCY=true
```

---

## ⚡ QPS Limits & Rate Limiting

### AI Model Rate Limits

| Model | QPS Limit | Daily Limit | Burst Capacity |
|-------|-----------|-------------|----------------|
| **gemini-2.5-pro** | 3 QPS | 10,000 requests | 5 requests |
| **gemini-1.5-pro** | 5 QPS | 15,000 requests | 10 requests |
| **gemini-1.5-flash** | 10 QPS | 50,000 requests | 20 requests |

### Token Bucket Configuration

The system uses a **token bucket algorithm** for rate limiting:

```typescript
// Configured via AI_RATE_QPS environment variable
const bucket = new TokenBucket(
  capacity: AI_RATE_QPS,    // Max burst capacity
  refillPerSec: AI_RATE_QPS // Tokens refilled per second
);
```

**Behavior**:
- Requests consume 1 token from the bucket
- Bucket refills at `AI_RATE_QPS` tokens/second
- If bucket is empty, requests wait until tokens are available
- Prevents exceeding API quotas and getting throttled

### Adjusting QPS Limits

**Development/Testing**:
```bash
AI_RATE_QPS=10  # Higher limit for testing
```

**Production**:
```bash
AI_RATE_QPS=3   # Conservative limit to avoid throttling
```

**High-Traffic Production**:
```bash
AI_RATE_QPS=5   # Requires higher API quota
```

### Monitoring Rate Limits

Check metrics for rate limit violations:

```bash
# Check rate limit denials (should be near 0)
metrics.getCounter("ai.rate_limit.denied")

# Check current QPS
metrics.getGauge("ai.requests_per_second")
```

---

## 🔄 Fallback Behavior

### Model Fallback Chain

When a model fails, the system automatically falls back to alternative models:

```
Primary: gemini-2.5-pro
   ↓ (on failure)
Fallback 1: gemini-1.5-pro
   ↓ (on failure)
Fallback 2: gemini-1.5-flash
   ↓ (on failure)
ERROR: All models failed
```

### Retry Strategy

**Network Errors** (transient):
- Max retries: 3
- Backoff: Exponential (200ms, 400ms, 800ms)
- Retryable: Connection errors, timeouts, 429 rate limit

**API Key Errors** (permanent):
- Max retries: 0 (fail immediately)
- Not retryable: Invalid API key, permission denied

**Code Example**:
```typescript
// Automatic retry with exponential backoff
for (let attempt = 0; attempt <= maxRetries; attempt++) {
  try {
    return await model.generateContent(request);
  } catch (err) {
    if (isPermissionError(err)) throw err; // No retry
    if (attempt < maxRetries) {
      await sleep(200 * (2 ** attempt)); // Exponential backoff
    }
  }
}
```

### Circuit Breaker

Prevents cascade failures when downstream services are down:

```bash
# Enable circuit breaker
ENABLE_CIRCUIT_BREAKER=true
```

**States**:
- **CLOSED**: Normal operation
- **OPEN**: Service unavailable, fail fast
- **HALF_OPEN**: Testing if service recovered

**Thresholds**:
- Opens after: 5 consecutive failures
- Half-open after: 30 seconds
- Closes after: 2 consecutive successes

---

## 🏥 Health Checks & Monitoring

### Health Endpoints

#### Liveness Probe
```bash
GET /health

# Expected Response (200 OK)
{
  "status": "ok",
  "timestamp": 1234567890,
  "uptime": 123.45
}
```

**Purpose**: Detect if application is deadlocked or crashed  
**K8s/Cloud Run**: Restart container if check fails

#### Readiness Probe
```bash
GET /health/ready

# Expected Response (200 OK)
{
  "status": "healthy",
  "checks": {
    "database": "healthy",
    "redis": "healthy",
    "ai_service": "healthy"
  }
}
```

**Purpose**: Detect if application can serve traffic  
**K8s/Cloud Run**: Remove from load balancer if check fails

### Key Metrics

#### Application Metrics
```typescript
// Success/Failure Counters
metrics.increment("task.success", 1, { task: "generate" });
metrics.increment("task.failure", 1, { task: "generate" });

// Execution Time Gauge
metrics.gauge("workflow.execution_ms", durationMs);

// Rate Limit Denials
metrics.increment("ai.rate_limit.denied");
```

#### Infrastructure Metrics
- CPU Usage: < 80% (alert if sustained > 80%)
- Memory Usage: < 85% (alert if > 85%)
- Disk I/O: Monitor read/write latency
- Network: Monitor egress bandwidth

### Alerting Thresholds

| Metric | Warning | Critical | Action |
|--------|---------|----------|--------|
| Error Rate | > 5% | > 10% | Page on-call |
| P95 Latency | > 2s | > 5s | Investigate |
| CPU Usage | > 70% | > 85% | Scale up |
| Memory Usage | > 75% | > 90% | Scale up |
| Rate Limit Denials | > 10/min | > 50/min | Increase QPS |
| Health Check Failures | 2 consecutive | 5 consecutive | Restart service |

### Log Analysis

**Structured Logs** (JSON format via Pino):

```json
{
  "level": "info",
  "time": 1234567890,
  "msg": "Workflow completed",
  "workflowId": "wf-123",
  "duration": 1234,
  "status": "SUCCESS"
}
```

**Key Log Patterns**:
```bash
# Find errors
cat logs.json | jq 'select(.level == "error")'

# Find slow workflows (> 5s)
cat logs.json | jq 'select(.duration > 5000)'

# Find rate limit denials
cat logs.json | jq 'select(.msg | contains("rate limit"))'
```

---

## 🚨 Incident Response

### Common Issues

#### 1. High Error Rate

**Symptoms**:
- Error rate > 10%
- Many failed workflows
- Customer complaints

**Diagnosis**:
```bash
# Check error types
curl http://localhost:8080/metrics | grep error

# Check logs
tail -n 1000 /var/log/app.log | grep ERROR
```

**Resolution**:
1. Check if AI service is down → switch to fallback model
2. Check rate limits → increase `AI_RATE_QPS`
3. Check database connection pool → restart service
4. Roll back recent deployment if issue started after deploy

#### 2. Rate Limit Exceeded

**Symptoms**:
- `429 Too Many Requests` errors
- `ai.rate_limit.denied` metric increasing

**Diagnosis**:
```bash
# Check current QPS
echo $AI_RATE_QPS

# Check denied requests
metrics.getCounter("ai.rate_limit.denied")
```

**Resolution**:
```bash
# Option 1: Increase QPS limit (requires higher API quota)
export AI_RATE_QPS=5

# Option 2: Enable caching to reduce API calls
export ENABLE_CACHE=true

# Option 3: Use faster model (lower quality)
export AI_MODEL_DEFAULT=gemini-1.5-flash
```

#### 3. HMAC Signature Failures

**Symptoms**:
- `HMAC verification failed` errors
- Agents not receiving messages

**Diagnosis**:
```bash
# Check active key ID
echo $COMM_HMAC_ACTIVE_KEY_ID

# Check if key exists
env | grep COMM_HMAC
```

**Resolution**:
```bash
# Rotate to new key
export COMM_HMAC_ACTIVE_KEY_ID=prod-v2

# Ensure old key still available for verification
# Don't remove old keys until grace period (24h)
```

#### 4. Database Connection Issues

**Symptoms**:
- `Connection pool exhausted` errors
- High latency on database queries

**Diagnosis**:
```bash
# Check database connection
psql $DATABASE_URL -c "SELECT 1;"

# Check active connections
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"
```

**Resolution**:
1. Increase connection pool size
2. Check for long-running queries and kill them
3. Restart application to reset pool
4. Scale up database if needed

---

## 🚀 Deployment Procedures

### Pre-Deployment Checklist

- [ ] All tests passing (`pnpm test:ci`)
- [ ] Coverage >= 80%
- [ ] No TypeScript errors (`pnpm typecheck`)
- [ ] No linting errors (`pnpm lint`)
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Backup created

### Deployment Steps

#### 1. Build & Test Locally
```bash
pnpm -w run build
pnpm run test:ci
```

#### 2. Deploy to Staging
```bash
# Deploy to staging environment
gcloud run deploy agent-team-staging \
  --source . \
  --region us-central1 \
  --set-env-vars NODE_ENV=staging
```

#### 3. Run Smoke Tests
```bash
# Run smoke tests against staging
pnpm run smoke -- --env staging
```

#### 4. Deploy to Production
```bash
# Deploy with gradual rollout (Canary)
gcloud run deploy agent-team \
  --source . \
  --region us-central1 \
  --set-env-vars NODE_ENV=production \
  --no-traffic  # Don't send traffic yet

# Gradually shift traffic
gcloud run services update-traffic agent-team \
  --to-revisions LATEST=10  # 10% traffic

# Monitor for 15 minutes, then increase
gcloud run services update-traffic agent-team \
  --to-revisions LATEST=50  # 50% traffic

# If all good, send all traffic
gcloud run services update-traffic agent-team \
  --to-revisions LATEST=100
```

### Rollback Procedure

**If issues detected after deployment**:

```bash
# Quick rollback to previous revision
gcloud run services update-traffic agent-team \
  --to-revisions <PREVIOUS_REVISION>=100

# Example
gcloud run services update-traffic agent-team \
  --to-revisions agent-team-00042-xyz=100
```

---

## 💾 Backup & Recovery

### Database Backups

**Automated Backups** (Supabase):
- Daily full backups (retained 7 days)
- Point-in-time recovery (PITR) available
- Backups stored in separate region

**Manual Backup**:
```bash
# Backup database
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Compress and upload to GCS
gzip backup-*.sql
gsutil cp backup-*.sql.gz gs://agent-team-backups/
```

**Restore from Backup**:
```bash
# Download backup
gsutil cp gs://agent-team-backups/backup-20251021.sql.gz .
gunzip backup-20251021.sql.gz

# Restore
psql $DATABASE_URL < backup-20251021.sql
```

### State Management

**Session State**:
- Stored in Redis with TTL
- Lost if Redis restarts (acceptable)
- Workflows can be re-executed from snapshot

**Workflow Snapshots**:
- Saved to database after each step
- Used for debugging and recovery
- Retention: 30 days

---

## 🛡️ Security Considerations

### Secrets Management

**Never commit secrets to Git**. Use:
- Google Secret Manager (production)
- Environment variables (development)
- `.env` file (local, gitignored)

```bash
# Store secret
echo -n "my-secret-value" | gcloud secrets create my-secret --data-file=-

# Access in Cloud Run
gcloud run services update agent-team \
  --update-secrets GEMINI_API_KEY=gemini-key:latest
```

### HMAC Key Rotation

**Rotate keys every 90 days**:

1. **Generate new key**:
```bash
openssl rand -base64 32
```

2. **Add new key** (keep old key active):
```bash
COMM_HMAC_KEY_V2=<new-secret>
```

3. **Switch active key**:
```bash
COMM_HMAC_ACTIVE_KEY_ID=key-v2
```

4. **Grace period**: Keep old key for 24 hours to verify old messages

5. **Remove old key** after grace period

### Network Security

- **TLS**: All external traffic uses TLS 1.3
- **VPC**: Backend services in private VPC
- **Firewall**: Only ports 80/443 exposed
- **DDoS Protection**: Cloudflare enabled

### Input Validation

- All API inputs validated with Zod schemas
- Rate limiting: 100 req/min per IP
- Payload size limit: 512KB
- SQL injection prevention: Parameterized queries

---

## 📞 Support Contacts

- **On-Call**: [PagerDuty rotation]
- **Platform Team**: platform@agent-team.dev
- **Security**: security@agent-team.dev
- **Escalation**: CTO escalation path

---

## 📚 Additional Resources

- [Architecture Documentation](./ARCHITECTURE.md)
- [API Documentation](./docs/api.md)
- [Development Guide](./docs/development.md)
- [Monitoring Dashboard](https://grafana.agent-team.dev)
- [Status Page](https://status.agent-team.dev)

---

**Last Updated**: 2025-10-21  
**Next Review**: 2025-11-21  
**Document Owner**: Platform Engineering Lead
