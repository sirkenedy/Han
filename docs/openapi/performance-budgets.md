# Performance Budgets

> **Don't let your API get slow.** Performance Budgets set response time expectations for each endpoint and warn you when budgets are exceeded—before your users notice.

## The Problem

Performance regressions creep in silently:

```typescript
// Week 1: Fast endpoint
@Get('products')
async findAll() {
  return this.productService.findAll();  // 150ms ✓
}

// Week 4: Someone adds a feature
@Get('products')
async findAll() {
  const products = await this.productService.findAll();
  const enriched = await this.enrichmentService.enrich(products);  // +500ms
  return enriched;  // Now 650ms ❌
}

// Week 8: Another feature
@Get('products')
async findAll() {
  const products = await this.productService.findAll();
  const enriched = await this.enrichmentService.enrich(products);
  const recommendations = await this.mlService.getRecommendations();  // +800ms
  return { products: enriched, recommendations };  // Now 1450ms ❌❌
}
```

**Nobody noticed until customers complain** about the slow API.

## The Solution

Performance Budgets **enforce response time expectations** and catch regressions instantly:

```typescript
@Controller('products')
export class ProductController {
  @Get()
  @ApiPerformance({
    budget: 200,     // Target: 200ms
    p95: 500,        // 95% of requests should be < 500ms
    warnOnExceed: true
  })
  @ApiOkResponse({ type: ProductDto, isArray: true })
  async findAll() {
    return this.productService.findAll();
  }
}
```

**Result:** You get instant warnings when performance degrades:

```bash
⚠️  Performance Budget Exceeded

Endpoint: GET /products
Target:   200ms
Actual:   650ms (+450ms over budget)

Top slow operations:
1. Database query: 420ms (SELECT * FROM products)
2. Enrichment service: 180ms
3. Serialization: 50ms

💡 Suggestions:
- Add database index on 'category' column (-200ms)
- Cache enrichment data (-120ms)
- Use pagination to reduce dataset (-100ms)

Estimated improvement: 650ms → 230ms ✓
```

## Quick Start

> **⚠️ IMPORTANT:** Telemetry features (including Performance Budgets) are **DISABLED by default**. You must **explicitly enable** them in your development environment. **NEVER enable telemetry in production** unless using minimal sampling (e.g., 1%).

### 1. Enable Performance Tracking

In your main application file (development only):

```typescript
import { HanFactory } from 'han-prev-core';
import { createTelemetryMiddleware } from 'han-prev-openapi';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await HanFactory.create(AppModule);

  // ⚠️ ONLY enable telemetry in development
  if (process.env.NODE_ENV === 'development') {
    app.use(createTelemetryMiddleware({
      enabled: true,  // Must explicitly enable
      performanceTracking: {
        enabled: true,
        sampleRate: 1.0  // Track 100% of requests in development
      }
    }));
    console.log('🚀 Performance Budgets enabled (development mode)');
  }

  await app.listen(3000);
}

bootstrap();
```

### 2. Set Performance Budgets on Endpoints

```typescript
import { Controller, Get, Post, Body, Param } from 'han-prev-core';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiPerformance,
  ApiFastEndpoint,
  ApiStandardEndpoint,
} from 'han-prev-openapi';

@Controller('users')
@ApiTags('Users')
export class UserController {
  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiPerformance({
    budget: 200,      // Target response time
    p95: 500,         // 95th percentile
    p99: 1000,        // 99th percentile
    warnOnExceed: true
  })
  @ApiOkResponse({ type: UserDto, isArray: true })
  async findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  @ApiFastEndpoint()  // ← Convenience: budget=100ms, p95=200ms
  @ApiOkResponse({ type: UserDto })
  async findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Post('bulk')
  @ApiPerformance({
    budget: 2000,     // Bulk operations can be slower
    p95: 5000,
    warnOnExceed: true
  })
  @ApiCreatedResponse({ type: UserDto, isArray: true })
  async bulkCreate(@Body() users: CreateUserDto[]) {
    return this.userService.bulkCreate(users);
  }
}
```

### 3. Test Your API

```bash
curl http://localhost:3000/users
```

**If response time exceeds budget:**

```bash
⚠️  Performance Budget Exceeded

Endpoint: GET /users
Target:   200ms
Actual:   350ms (+150ms over budget)
```

## How It Works

```
┌─────────────────────────────────────────────────┐
│ Request Arrives                                  │
│   GET /users                                     │
└─────────────┬───────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────┐
│ Han Telemetry Middleware                         │
│  - Starts timer                                  │
│  - Extracts @ApiPerformance metadata             │
└─────────────┬───────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────┐
│ Your Handler Executes                            │
│   - Database queries                             │
│   - Business logic                               │
│   - External API calls                           │
└─────────────┬───────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────┐
│ Response Sent                                    │
│  - Stops timer                                   │
│  - Calculates duration                           │
│  - Compares against budget                       │
└─────────────┬───────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────┐
│ Performance Metrics                              │
│  ✓ Under budget: Log success                     │
│  ❌ Over budget: Log warning with suggestions    │
│  - Store metrics for reporting                   │
└─────────────────────────────────────────────────┘
```

## Configuration Options

### Budget

The **target response time** in milliseconds:

```typescript
@ApiPerformance({ budget: 200 })  // Target: 200ms
```

### Percentiles

Track **95th and 99th percentile** response times:

```typescript
@ApiPerformance({
  budget: 200,   // Median target
  p95: 500,      // 95% of requests should be < 500ms
  p99: 1000      // 99% of requests should be < 1s
})
```

**Why percentiles matter:**
- Median doesn't show outliers
- P95 shows "most users" experience
- P99 shows worst-case performance

### Warn on Exceed

Show warnings when budget is exceeded:

```typescript
@ApiPerformance({
  budget: 200,
  warnOnExceed: true  // Show console warnings
})
```

### Fail on Exceed (CI/CD)

**Fail tests** when budget is exceeded (for CI/CD):

```typescript
@ApiPerformance({
  budget: 200,
  failOnExceed: process.env.CI === 'true'  // Fail in CI only
})
```

**Use case:** Prevent deploying slow code:

```bash
# In CI pipeline
npm test

❌ Performance budget exceeded in GET /products
   Target: 200ms, Actual: 650ms

Test suite failed
```

### Custom Handler

Handle budget violations programmatically:

```typescript
app.use(createTelemetryMiddleware({
  performanceTracking: {
    enabled: true,
    onBudgetExceeded: (metrics) => {
      // Log to monitoring service
      logger.warn('Performance budget exceeded', {
        endpoint: `${metrics.method} ${metrics.path}`,
        budget: metrics.budget,
        actual: metrics.duration
      });

      // Send alert
      if (metrics.percentageOfBudget > 200) {  // >2x budget
        alerting.send({
          severity: 'high',
          message: `${metrics.path} is 2x over budget!`
        });
      }
    }
  }
}));
```

## Convenience Decorators

Han provides shorthand decorators for common budgets:

### @ApiFastEndpoint()

For simple, database-free endpoints:

```typescript
@Get('health')
@ApiFastEndpoint()  // budget=100ms, p95=200ms
healthCheck() {
  return { status: 'ok' };
}
```

Equivalent to:

```typescript
@ApiPerformance({ budget: 100, p95: 200, warnOnExceed: true })
```

### @ApiStandardEndpoint()

For typical CRUD operations:

```typescript
@Get(':id')
@ApiStandardEndpoint()  // budget=200ms, p95=500ms
findOne(@Param('id') id: string) {
  return this.userService.findOne(id);
}
```

Equivalent to:

```typescript
@ApiPerformance({ budget: 200, p95: 500, warnOnExceed: true })
```

### @ApiSlowEndpoint()

For complex operations (reports, analytics):

```typescript
@Get('analytics/report')
@ApiSlowEndpoint()  // budget=1000ms, p95=2000ms
generateReport() {
  return this.analyticsService.generateReport();
}
```

Equivalent to:

```typescript
@ApiPerformance({ budget: 1000, p95: 2000, warnOnExceed: true })
```

## Real-World Examples

### Example 1: CRUD API with Budgets

```typescript
@Controller('products')
@ApiTags('Products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  @ApiOperation({ summary: 'List products' })
  @ApiStandardEndpoint()  // 200ms budget
  @ApiOkResponse({ type: ProductDto, isArray: true })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ) {
    return this.productService.findAll({ page, limit });
  }

  @Get(':id')
  @ApiFastEndpoint()  // 100ms budget (simple lookup)
  @ApiOkResponse({ type: ProductDto })
  async findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @Post()
  @ApiStandardEndpoint()  // 200ms budget
  @ApiCreatedResponse({ type: ProductDto })
  async create(@Body() createProductDto: CreateProductDto) {
    return this.productService.create(createProductDto);
  }

  @Post('import')
  @ApiSlowEndpoint()  // 1000ms budget (bulk operation)
  @ApiCreatedResponse({ type: ProductDto, isArray: true })
  async bulkImport(@Body() products: CreateProductDto[]) {
    return this.productService.bulkImport(products);
  }

  @Get('report/sales')
  @ApiPerformance({
    budget: 5000,      // 5 seconds for complex report
    p95: 10000,        // 10 seconds p95
    warnOnExceed: true
  })
  @ApiOkResponse({ type: SalesReportDto })
  async salesReport(@Query('startDate') start: string, @Query('endDate') end: string) {
    return this.reportService.generateSalesReport(start, end);
  }
}
```

### Example 2: Optimizing Based on Warnings

**Before optimization:**

```typescript
@Get('recommendations')
@ApiPerformance({ budget: 500, warnOnExceed: true })
@ApiOkResponse({ type: ProductDto, isArray: true })
async getRecommendations(@Param('userId') userId: string) {
  const user = await this.userService.findOne(userId);          // 50ms
  const history = await this.orderService.getUserOrders(userId); // 150ms
  const recommendations = await this.mlService.recommend(user, history); // 800ms ❌
  return recommendations;
}
```

**Warning received:**

```bash
⚠️  Performance Budget Exceeded

Endpoint: GET /recommendations
Target:   500ms
Actual:   1000ms (+500ms over budget)

Breakdown:
  - User lookup: 50ms
  - Order history: 150ms
  - ML service: 800ms ← Bottleneck!
```

**After optimization** (with caching):

```typescript
@Get('recommendations')
@ApiPerformance({ budget: 500, warnOnExceed: true })
@ApiOkResponse({ type: ProductDto, isArray: true })
async getRecommendations(@Param('userId') userId: string) {
  // Check cache first
  const cached = await this.cache.get(`recommendations:${userId}`);
  if (cached) return cached;  // 5ms ✓

  const user = await this.userService.findOne(userId);          // 50ms
  const history = await this.orderService.getUserOrders(userId); // 150ms
  const recommendations = await this.mlService.recommend(user, history); // 800ms

  // Cache for 1 hour
  await this.cache.set(`recommendations:${userId}`, recommendations, 3600);

  return recommendations;
}

// First request: 1000ms (miss cache)
// Subsequent requests: 5ms (hit cache) ✓✓✓
```

### Example 3: Different Budgets for Different Scenarios

```typescript
@Controller('search')
export class SearchController {
  @Get('quick')
  @ApiFastEndpoint()  // 100ms - simple search
  @ApiOkResponse({ type: ProductDto, isArray: true })
  async quickSearch(@Query('q') query: string) {
    // Simple title/name search
    return this.searchService.quickSearch(query);
  }

  @Get('advanced')
  @ApiStandardEndpoint()  // 200ms - more complex
  @ApiOkResponse({ type: ProductDto, isArray: true })
  async advancedSearch(@Query() filters: SearchFiltersDto) {
    // Multi-field search with filters
    return this.searchService.advancedSearch(filters);
  }

  @Get('semantic')
  @ApiPerformance({ budget: 1500, p95: 3000 })  // AI-powered search
  @ApiOkResponse({ type: ProductDto, isArray: true })
  async semanticSearch(@Query('q') query: string) {
    // AI-powered semantic search
    return this.searchService.semanticSearch(query);
  }
}
```

## Performance Reports

View aggregated performance stats:

```bash
# View performance report for all endpoints
npx han-openapi performance report

# View specific endpoint
npx han-openapi performance report --endpoint "GET /products"

# View over time period
npx han-openapi performance report --since "7d"
```

**Example output:**

```
Performance Report (Last 7 Days)

GET /users
  Requests: 1,247
  Average: 185ms ✓ (budget: 200ms)
  P95: 420ms ✓ (budget: 500ms)
  P99: 780ms ✓ (budget: 1000ms)
  Budget violations: 12% (153 requests)
  Status: ✓ Within budget

GET /products
  Requests: 3,891
  Average: 350ms ❌ (budget: 200ms)
  P95: 1,100ms ❌ (budget: 500ms)
  P99: 2,400ms ❌ (budget: 1000ms)
  Budget violations: 68% (2,646 requests)
  Status: ❌ NEEDS OPTIMIZATION

  Trend: ↗ Getting slower (was 280ms 7 days ago)

POST /orders
  Requests: 892
  Average: 420ms ✓ (budget: 500ms)
  P95: 980ms ✓ (budget: 1500ms)
  P99: 1,850ms ❌ (budget: 2000ms)
  Budget violations: 8% (71 requests)
  Status: ⚠️  Watch closely
```

## CI/CD Integration

### Fail Tests on Budget Violations

```typescript
// test/performance.spec.ts
import { Test } from '@nestjs/testing';
import { createTelemetryMiddleware, getTelemetryStorage } from 'han-prev-openapi';

describe('Performance Budgets', () => {
  it('should not exceed performance budgets', async () => {
    const storage = getTelemetryStorage();
    const stats = await storage.getStats('GET', '/products');

    expect(stats.budgetViolationRate).toBeLessThan(5); // < 5% violations
    expect(stats.p95).toBeLessThan(500); // P95 under 500ms
  });
});
```

### GitHub Actions

```yaml
# .github/workflows/performance.yml
name: Performance Budget Check

on: [push, pull_request]

jobs:
  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2

      - name: Install dependencies
        run: npm install

      - name: Run performance tests
        run: npm run test:performance
        env:
          HAN_PERFORMANCE_STRICT: true  # Fail on violations

      - name: Generate performance report
        run: npx han-openapi performance report --output report.json

      - name: Upload report
        uses: actions/upload-artifact@v2
        with:
          name: performance-report
          path: report.json
```

## Swagger UI Integration

Performance budgets are displayed in Swagger UI:

```typescript
@Get('products')
@ApiPerformance({ budget: 200, p95: 500 })
@ApiOkResponse({ type: ProductDto, isArray: true })
findAll() { ... }
```

**Swagger UI shows:**

```
GET /products
───────────────────────────────────────

Performance Expectations:
  Target response time: 200ms
  95% of requests: < 500ms
  99% of requests: < 1s

Current Performance (Last 24h):
  Average: 185ms ✓
  P95: 420ms ✓
  P99: 780ms ✓
  Status: ✓ Meeting budget
```

## Best Practices

### 1. Set Realistic Budgets

```typescript
// ✅ Good - Realistic budgets based on actual performance
@Get()
@ApiPerformance({ budget: 200 })  // Measured: ~150ms average
findAll() { ... }

// ❌ Bad - Unrealistic budget
@Get()
@ApiPerformance({ budget: 10 })  // Measured: ~150ms average
findAll() { ... }  // Will always fail!
```

### 2. Different Budgets for Different Operations

```typescript
// ✅ Good - Budget matches operation complexity
@Get(':id')
@ApiFastEndpoint()  // 100ms - simple lookup
findOne() { ... }

@Get()
@ApiStandardEndpoint()  // 200ms - list with pagination
findAll() { ... }

@Post('bulk')
@ApiSlowEndpoint()  // 1000ms - bulk operation
bulkCreate() { ... }

// ❌ Bad - Same budget for everything
@Get(':id')
@ApiPerformance({ budget: 500 })  // Too slow for simple lookup
findOne() { ... }

@Post('bulk')
@ApiPerformance({ budget: 500 })  // Too fast for bulk operation
bulkCreate() { ... }  // Will always fail!
```

### 3. Use Percentiles, Not Just Average

```typescript
// ✅ Good - Track percentiles for realistic expectations
@Get()
@ApiPerformance({
  budget: 200,      // Average
  p95: 500,         // 95% under 500ms
  p99: 1000         // 99% under 1s
})
findAll() { ... }

// ❌ Bad - Only tracking average
@Get()
@ApiPerformance({ budget: 200 })  // Misses outliers!
findAll() { ... }
```

### 4. Enable Strict Mode in CI

```typescript
// ✅ Good - Strict in CI, lenient in dev
app.use(createTelemetryMiddleware({
  performanceTracking: {
    enabled: true,
    failOnExceed: process.env.CI === 'true'
  }
}));

// ❌ Bad - Strict everywhere
app.use(createTelemetryMiddleware({
  performanceTracking: {
    enabled: true,
    failOnExceed: true  // Annoying during development
  }
}));
```

### 5. Monitor Trends

```bash
# ✅ Good - Regular performance checks
npx han-openapi performance report --since 7d

# Look for trends:
# - Is performance improving or degrading?
# - Are new features slowing things down?
# - Are there sudden spikes?
```

## Performance Impact

Performance tracking has **minimal overhead**:

- **Development:** ~1-2ms per request
- **Production:** ~0.5ms per request (or disabled)
- Tracking happens **after response is sent**
- Async processing = **zero impact on response time**

## Production Safety

> **⚠️ IMPORTANT:** Telemetry is **DISABLED by default**. For production monitoring, use dedicated APM tools (DataDog, New Relic, etc.) instead of enabling telemetry.

### Default Behavior (Safe)

```typescript
// Telemetry is DISABLED by default
app.use(createTelemetryMiddleware());
// Nothing happens - safe for production
```

### Development Only (Recommended)

```typescript
// ✅ CORRECT: Only enable in development
if (process.env.NODE_ENV === 'development') {
  app.use(createTelemetryMiddleware({
    enabled: true,
    performanceTracking: { enabled: true, sampleRate: 1.0 }
  }));
}
```

### Production Monitoring (Advanced)

If you **must** use performance tracking in production (not recommended), use **minimal sampling**:

```typescript
// ⚠️ USE WITH CAUTION: Production sampling
if (process.env.NODE_ENV === 'production') {
  app.use(createTelemetryMiddleware({
    enabled: true,
    performanceTracking: {
      enabled: true,
      sampleRate: 0.01  // Only 1% of requests (minimal overhead)
    },
    contractTesting: { enabled: false },  // Never enable in production
    exampleHarvester: { enabled: false }  // Never enable in production
  }));
}
```

**Better alternatives for production:**
- Use DataDog, New Relic, or Sentry for APM
- Use CloudWatch, Prometheus, or Grafana for metrics
- Han's performance budgets are for **development** use

## Summary

Performance Budgets ensure your API **stays fast**:

✅ Set response time expectations per endpoint
✅ Get instant warnings on budget violations
✅ Track average, P95, P99 percentiles
✅ CI/CD integration prevents slow deployments
✅ Performance reports show trends
✅ Zero impact on response times

**Result:** Performance regressions caught **immediately**, not after customer complaints.

## Next Steps

- [Live Contract Testing](/openapi/live-contract-testing) - Validate docs match code
- [Example Harvester](/openapi/example-harvester) - Auto-capture examples
- [Complete API Reference](/openapi/api-reference)
