# Task Scheduling

Learn how to schedule and automate recurring tasks in your Han Framework application.

## Why Task Scheduling?

**Not everything should run immediately.** Some tasks need to run at specific times or intervals, independent of user requests.

**Real-World Scenarios:**

**Scenario 1: Sending Digest Emails**
```typescript
// ❌ Without scheduling - sends on every request (bad!)
@Post('subscribe')
async subscribe(@Body() email: string) {
  await this.emailService.sendWeeklyDigest(email);
  return { message: 'Subscribed!' };
}
```

```typescript
// ✅ With scheduling - sends once per week to all users
cron.schedule('0 9 * * MON', async () => {
  const users = await this.userService.getAllSubscribed();
  for (const user of users) {
    await this.emailService.sendWeeklyDigest(user.email);
  }
});
```

**Common Use Cases:**
- 📧 **Email Digests** - Daily/weekly summaries
- 🧹 **Data Cleanup** - Delete old logs, expired sessions
- 📊 **Report Generation** - Nightly analytics reports
- 🔄 **Data Sync** - Sync with external APIs
- 💾 **Backups** - Database backups at off-peak hours
- 📈 **Analytics** - Calculate metrics, update dashboards
- 🔔 **Reminders** - Send payment reminders, subscription renewals

::: tip When to Use Task Scheduling
- ✅ Tasks that run on a schedule (not triggered by users)
- ✅ Background jobs that don't need immediate execution
- ✅ Batch operations on large datasets
- ❌ Real-time user-facing operations
- ❌ Tasks that must run immediately
:::

## Using node-cron

### Installation

```bash
npm install node-cron @types/node-cron
```

### Basic Example

```typescript
import cron from 'node-cron';

// Run every minute
cron.schedule('* * * * *', () => {
  console.log('Running every minute');
});

// Run every day at midnight
cron.schedule('0 0 * * *', () => {
  console.log('Running at midnight');
});

// Run every Monday at 9 AM
cron.schedule('0 9 * * MON', () => {
  console.log('Running every Monday at 9 AM');
});
```

## Cron Syntax

```
 ┌─────────── minute (0 - 59)
 │ ┌───────── hour (0 - 23)
 │ │ ┌─────── day of month (1 - 31)
 │ │ │ ┌───── month (1 - 12)
 │ │ │ │ ┌─── day of week (0 - 7) (Sunday = 0 or 7)
 │ │ │ │ │
 * * * * *
```

### Common Patterns

```typescript
// Every minute
'* * * * *'

// Every 5 minutes
'*/5 * * * *'

// Every hour
'0 * * * *'

// Every day at midnight
'0 0 * * *'

// Every day at 2:30 AM
'30 2 * * *'

// Every Monday at 9 AM
'0 9 * * 1'

// Every 1st of the month at midnight
'0 0 1 * *'

// Every weekday at 6 PM
'0 18 * * 1-5'

// Every Sunday at noon
'0 12 * * 0'
```

## Creating a Scheduler Service

```typescript
// services/scheduler.service.ts
import { Injectable } from 'han-prev-core';
import cron from 'node-cron';

@Injectable()
export class SchedulerService {
  private tasks = new Map<string, cron.ScheduledTask>();

  schedule(name: string, cronExpression: string, callback: () => void) {
    if (this.tasks.has(name)) {
      console.warn(`Task "${name}" already exists`);
      return;
    }

    const task = cron.schedule(cronExpression, callback, {
      scheduled: false,
    });

    this.tasks.set(name, task);
    task.start();

    console.log(`✅ Scheduled task: ${name}`);
  }

  stop(name: string) {
    const task = this.tasks.get(name);

    if (task) {
      task.stop();
      console.log(`⏸️  Stopped task: ${name}`);
    }
  }

  start(name: string) {
    const task = this.tasks.get(name);

    if (task) {
      task.start();
      console.log(`▶️  Started task: ${name}`);
    }
  }

  destroy(name: string) {
    const task = this.tasks.get(name);

    if (task) {
      task.destroy();
      this.tasks.delete(name);
      console.log(`🗑️  Destroyed task: ${name}`);
    }
  }

  listTasks() {
    return Array.from(this.tasks.keys());
  }
}
```

## Common Scheduled Tasks

### 1. Database Cleanup

```typescript
// tasks/cleanup.task.ts
import { Injectable } from 'han-prev-core';
import { SchedulerService } from '../services/scheduler.service';

@Injectable()
export class CleanupTask {
  constructor(private scheduler: SchedulerService) {
    this.registerTasks();
  }

  private registerTasks() {
    // Clean up old sessions every hour
    this.scheduler.schedule('cleanup-sessions', '0 * * * *', async () => {
      console.log('Cleaning up old sessions...');
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

      await Session.deleteMany({
        createdAt: { $lt: cutoff },
      });

      console.log('Sessions cleaned');
    });

    // Clean up expired tokens daily at 2 AM
    this.scheduler.schedule('cleanup-tokens', '0 2 * * *', async () => {
      console.log('Cleaning up expired tokens...');

      await Token.deleteMany({
        expiresAt: { $lt: new Date() },
      });

      console.log('Tokens cleaned');
    });
  }
}
```

### 2. Email Notifications

```typescript
// tasks/email.task.ts
import { Injectable } from 'han-prev-core';
import { SchedulerService } from '../services/scheduler.service';
import { EmailService } from '../services/email.service';

@Injectable()
export class EmailTask {
  constructor(
    private scheduler: SchedulerService,
    private emailService: EmailService
  ) {
    this.registerTasks();
  }

  private registerTasks() {
    // Send daily digest at 8 AM
    this.scheduler.schedule('daily-digest', '0 8 * * *', async () => {
      console.log('Sending daily digest emails...');

      const users = await User.find({ digestEnabled: true });

      for (const user of users) {
        await this.emailService.sendDailyDigest(user.email);
      }

      console.log(`Sent digest to ${users.length} users`);
    });

    // Send weekly reports every Monday at 9 AM
    this.scheduler.schedule('weekly-reports', '0 9 * * 1', async () => {
      console.log('Sending weekly reports...');

      const admins = await User.find({ role: 'admin' });

      for (const admin of admins) {
        await this.emailService.sendWeeklyReport(admin.email);
      }

      console.log('Weekly reports sent');
    });
  }
}
```

### 3. Data Synchronization

```typescript
// tasks/sync.task.ts
import { Injectable } from 'han-prev-core';
import { SchedulerService } from '../services/scheduler.service';

@Injectable()
export class SyncTask {
  constructor(private scheduler: SchedulerService) {
    this.registerTasks();
  }

  private registerTasks() {
    // Sync with external API every 15 minutes
    this.scheduler.schedule('sync-products', '*/15 * * * *', async () => {
      console.log('Syncing products...');

      try {
        const products = await this.fetchExternalProducts();

        for (const product of products) {
          await Product.findOneAndUpdate(
            { externalId: product.id },
            product,
            { upsert: true }
          );
        }

        console.log(`Synced ${products.length} products`);
      } catch (error) {
        console.error('Sync failed:', error);
      }
    });
  }

  private async fetchExternalProducts() {
    // Fetch from external API
    return [];
  }
}
```

### 4. Report Generation

```typescript
// tasks/reports.task.ts
import { Injectable } from 'han-prev-core';
import { SchedulerService } from '../services/scheduler.service';

@Injectable()
export class ReportTask {
  constructor(private scheduler: SchedulerService) {
    this.registerTasks();
  }

  private registerTasks() {
    // Generate daily sales report at 11 PM
    this.scheduler.schedule('daily-sales-report', '0 23 * * *', async () => {
      console.log('Generating daily sales report...');

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const sales = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: today },
            status: 'completed',
          },
        },
        {
          $group: {
            _id: null,
            totalSales: { $sum: '$total' },
            orderCount: { $sum: 1 },
          },
        },
      ]);

      await Report.create({
        type: 'daily-sales',
        date: today,
        data: sales[0] || { totalSales: 0, orderCount: 0 },
      });

      console.log('Report generated');
    });

    // Generate monthly analytics on 1st of month
    this.scheduler.schedule('monthly-analytics', '0 0 1 * *', async () => {
      console.log('Generating monthly analytics...');

      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      const analytics = await this.calculateMonthlyMetrics(lastMonth);

      await Analytics.create({
        month: lastMonth,
        metrics: analytics,
      });

      console.log('Monthly analytics generated');
    });
  }

  private async calculateMonthlyMetrics(month: Date) {
    // Calculate metrics
    return {};
  }
}
```

### 5. Cache Warming

```typescript
// tasks/cache-warming.task.ts
import { Injectable } from 'han-prev-core';
import { SchedulerService } from '../services/scheduler.service';
import { RedisService } from '../cache/redis.service';

@Injectable()
export class CacheWarmingTask {
  constructor(
    private scheduler: SchedulerService,
    private redis: RedisService
  ) {
    this.registerTasks();
  }

  private registerTasks() {
    // Warm cache every 6 hours
    this.scheduler.schedule('cache-warming', '0 */6 * * *', async () => {
      console.log('Warming cache...');

      // Popular products
      const products = await Product.find()
        .sort({ views: -1 })
        .limit(100);

      for (const product of products) {
        await this.redis.set(
          `product:${product.id}`,
          product,
          3600
        );
      }

      // Categories
      const categories = await Category.find();
      await this.redis.set('categories:all', categories, 7200);

      console.log('Cache warmed');
    });
  }
}
```

## Background Jobs Queue

For more complex job processing, use a job queue:

```bash
npm install bull
```

```typescript
// services/queue.service.ts
import { Injectable } from 'han-prev-core';
import Bull from 'bull';

@Injectable()
export class QueueService {
  private queues = new Map<string, Bull.Queue>();

  createQueue(name: string, redisUrl?: string) {
    const queue = new Bull(name, redisUrl || 'redis://localhost:6379');

    this.queues.set(name, queue);

    return queue;
  }

  getQueue(name: string) {
    return this.queues.get(name);
  }

  async addJob(queueName: string, data: any, options?: Bull.JobOptions) {
    const queue = this.getQueue(queueName);

    if (!queue) {
      throw new Error(`Queue "${queueName}" not found`);
    }

    return await queue.add(data, options);
  }
}
```

### Processing Jobs

```typescript
// tasks/email-queue.task.ts
import { Injectable } from 'han-prev-core';
import { QueueService } from '../services/queue.service';
import { EmailService } from '../services/email.service';

@Injectable()
export class EmailQueueTask {
  constructor(
    private queueService: QueueService,
    private emailService: EmailService
  ) {
    this.setupQueue();
  }

  private setupQueue() {
    const emailQueue = this.queueService.createQueue('email');

    emailQueue.process(async (job) => {
      const { to, subject, body } = job.data;

      console.log(`Sending email to ${to}`);

      await this.emailService.send(to, subject, body);

      console.log(`Email sent to ${to}`);
    });

    // Retry failed jobs
    emailQueue.on('failed', (job, error) => {
      console.error(`Job ${job.id} failed:`, error);
    });

    // Log completed jobs
    emailQueue.on('completed', (job) => {
      console.log(`Job ${job.id} completed`);
    });
  }

  async queueEmail(to: string, subject: string, body: string) {
    await this.queueService.addJob('email', { to, subject, body });
  }
}
```

## Delayed Jobs

```typescript
// Schedule job to run after 1 hour
await queue.add(data, {
  delay: 60 * 60 * 1000, // 1 hour in milliseconds
});

// Schedule job to run at specific time
const runAt = new Date('2024-12-31 23:59:59');
await queue.add(data, {
  delay: runAt.getTime() - Date.now(),
});
```

## Repeating Jobs

```typescript
// Repeat every 5 minutes
await queue.add(data, {
  repeat: {
    every: 5 * 60 * 1000,
  },
});

// Repeat with cron pattern
await queue.add(data, {
  repeat: {
    cron: '0 0 * * *', // Every day at midnight
  },
});

// Repeat with limit
await queue.add(data, {
  repeat: {
    every: 60 * 1000,
    limit: 10, // Only repeat 10 times
  },
});
```

## Task Monitoring

```typescript
// services/task-monitor.service.ts
import { Injectable } from 'han-prev-core';

@Injectable()
export class TaskMonitorService {
  private taskHistory = new Map<string, any[]>();

  recordTaskExecution(taskName: string, success: boolean, duration: number) {
    const history = this.taskHistory.get(taskName) || [];

    history.push({
      timestamp: new Date(),
      success,
      duration,
    });

    // Keep only last 100 executions
    if (history.length > 100) {
      history.shift();
    }

    this.taskHistory.set(taskName, history);
  }

  getTaskStats(taskName: string) {
    const history = this.taskHistory.get(taskName) || [];

    if (history.length === 0) {
      return null;
    }

    const successful = history.filter(h => h.success).length;
    const failed = history.length - successful;
    const avgDuration =
      history.reduce((sum, h) => sum + h.duration, 0) / history.length;

    return {
      totalExecutions: history.length,
      successful,
      failed,
      successRate: (successful / history.length) * 100,
      avgDuration,
      lastExecution: history[history.length - 1],
    };
  }
}
```

## Error Handling

```typescript
this.scheduler.schedule('risky-task', '*/5 * * * *', async () => {
  try {
    await this.performRiskyOperation();
  } catch (error) {
    console.error('Task failed:', error);

    // Send alert
    await this.alertService.sendAlert({
      task: 'risky-task',
      error: error.message,
      timestamp: new Date(),
    });

    // Log error
    await ErrorLog.create({
      task: 'risky-task',
      error: error.message,
      stack: error.stack,
    });
  }
});
```

## Best Practices

### 1. Use Idempotent Tasks

```typescript
// ✅ Good - Idempotent (safe to run multiple times)
async function cleanupOldSessions() {
  await Session.deleteMany({
    createdAt: { $lt: new Date(Date.now() - 86400000) },
  });
}

// ❌ Bad - Not idempotent
async function sendDailyEmail() {
  await Email.send(); // Could send duplicate emails
}
```

### 2. Add Logging

```typescript
// ✅ Good
this.scheduler.schedule('backup', '0 2 * * *', async () => {
  console.log('Starting backup...');
  const startTime = Date.now();

  try {
    await this.performBackup();
    const duration = Date.now() - startTime;
    console.log(`Backup completed in ${duration}ms`);
  } catch (error) {
    console.error('Backup failed:', error);
  }
});
```

### 3. Monitor Performance

```typescript
// ✅ Good
this.scheduler.schedule('sync', '*/15 * * * *', async () => {
  const start = Date.now();

  await this.syncData();

  const duration = Date.now() - start;
  await this.monitor.recordTaskExecution('sync', true, duration);
});
```

### 4. Use Timezone Awareness

```typescript
this.scheduler.schedule('daily-report', '0 9 * * *', async () => {
  // Runs at 9 AM in server timezone
}, {
  timezone: 'America/New_York', // Specify timezone
});
```

## Quick Reference

```typescript
// Cron patterns
'* * * * *'           // Every minute
'*/5 * * * *'         // Every 5 minutes
'0 * * * *'           // Every hour
'0 0 * * *'           // Every day at midnight
'0 9 * * 1'           // Every Monday at 9 AM
'0 0 1 * *'           // 1st of month at midnight

// Schedule task
scheduler.schedule('name', '* * * * *', callback);

// Control task
scheduler.stop('name');
scheduler.start('name');
scheduler.destroy('name');

// Queue job
await queue.add(data);
await queue.add(data, { delay: 3600000 }); // 1 hour delay
await queue.add(data, { repeat: { cron: '0 0 * * *' } });
```

## Next Steps

- Learn about [Caching](/techniques/caching) for performance optimization
- Explore [Configuration](/techniques/configuration) for task settings
- Check out [Middleware](/techniques/middleware) for request processing

Task scheduling automates your application and improves efficiency! ⏰
