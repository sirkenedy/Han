# ACID Compliance & Transaction Guide

## Overview

The `han-prev-mongoose` package provides **multiple transaction strategies** with different ACID guarantees. Understanding when to use each is critical for data consistency.

---

## ACID Compliance Matrix

| Scenario | Strategy | Atomicity | Consistency | Isolation | Durability | Performance | Use Case |
|----------|----------|-----------|-------------|-----------|------------|-------------|----------|
| **Single Database** | `withTransaction()` | ✅ Full | ✅ Full | ✅ Full | ✅ Full | ⚡ Fast | Standard operations |
| **Cross-DB (Parallel)** | `withCrossDbTransaction()` | ⚠️ Best Effort | ⚠️ Risk | ✅ Full | ✅ Full | ⚡ Fast | Non-critical cross-DB |
| **Cross-DB (2PC)** | `withTwoPhaseCommit()` | ✅ Strong | ✅ Strong | ✅ Full | ✅ Full | 🐌 Slower | Critical cross-DB |
| **Saga Pattern** | Manual implementation | ⚠️ Eventual | ✅ Eventual | ❌ None | ✅ Full | ⚡ Fast | Microservices |

---

## Transaction Strategies Explained

### 1. Single Database Transactions ✅ FULLY ACID

**Use `withTransaction()` for operations within ONE database.**

```typescript
import { withTransaction } from 'han-prev-mongoose';

const result = await withTransaction(
  connection,
  async (session) => {
    // All operations use the same session
    await User.create([userData], { session });
    await Post.create([postData], { session });
    await Comment.create([commentData], { session });
  }
);
```

**ACID Guarantees:**
- ✅ **Atomicity**: All operations succeed or all fail (automatic rollback)
- ✅ **Consistency**: MongoDB enforces schema validation and constraints
- ✅ **Isolation**: Snapshot isolation prevents dirty reads
- ✅ **Durability**: `writeConcern: 'majority'` ensures data persistence

**Rollback:**
- Automatic on any error
- Automatic on timeout
- Automatic on validation failure

---

### 2. Cross-Database Parallel ⚠️ BEST EFFORT ACID

**Use `withCrossDbTransaction()` for non-critical cross-database operations.**

```typescript
import { withCrossDbTransaction } from 'han-prev-mongoose';

const result = await withCrossDbTransaction(
  [
    { name: 'APP', connection: appConnection },
    { name: 'LOG', connection: logConnection }
  ],
  async (txn) => {
    const appSession = txn.getSession('APP');
    const logSession = txn.getSession('LOG');

    await User.create([userData], { session: appSession });
    await AuditLog.create([logData], { session: logSession });
  }
);
```

**ACID Guarantees:**
- ⚠️ **Atomicity**: **PARTIAL** - Operations are atomic per database, but commits happen in parallel
- ⚠️ **Consistency**: **RISK** - If one commit fails after another succeeds, data may be inconsistent
- ✅ **Isolation**: Full isolation per database
- ✅ **Durability**: Full durability per database

**The Problem:**
```typescript
// Internal implementation (SIMPLIFIED)
await Promise.all([
  db1Session.commitTransaction(), // ✅ Succeeds
  db2Session.commitTransaction(), // ❌ Fails
]);
// Result: DB1 committed, DB2 rolled back = INCONSISTENT STATE
```

**Rollback:**
- ✅ Automatic during operations phase
- ❌ **NOT possible after partial commit** - This is the critical limitation

**When to Use:**
- Logging/auditing (can tolerate missing logs)
- Analytics (can tolerate data loss)
- Non-critical notifications
- Performance is critical
- Eventual consistency is acceptable

---

### 3. Two-Phase Commit (2PC) ✅ STRONG ACID

**Use `withTwoPhaseCommit()` for critical cross-database operations.**

```typescript
import { withTwoPhaseCommit } from 'han-prev-mongoose';

const result = await withTwoPhaseCommit(
  [
    { name: 'ORDERS', connection: ordersConnection },
    { name: 'INVENTORY', connection: inventoryConnection }
  ],
  async (txn) => {
    const ordersSession = txn.getSession('ORDERS');
    const inventorySession = txn.getSession('INVENTORY');

    // Create order
    await Order.create([orderData], { session: ordersSession });

    // Decrement inventory
    await Inventory.findByIdAndUpdate(
      productId,
      { $inc: { quantity: -1 } },
      { session: inventorySession }
    );
  }
);

if (!result.success) {
  console.error('Transaction failed:', result.error);
  // All databases rolled back - consistent state maintained
}
```

**ACID Guarantees:**
- ✅ **Atomicity**: **STRONG** - Commits sequentially, detects failures early
- ✅ **Consistency**: **STRONG** - Partial failures trigger complete rollback
- ✅ **Isolation**: Full isolation per database
- ✅ **Durability**: Full durability per database

**How It Works:**
```typescript
// Phase 1: Prepare (operations execute)
await executeOperations();

// Phase 2: Commit (sequential for safety)
try {
  await db1Session.commitTransaction(); // Step 1
  await db2Session.commitTransaction(); // Step 2
  await db3Session.commitTransaction(); // Step 3
  // All succeeded ✅
} catch (error) {
  // One failed - abort all uncommitted
  // Error includes which DBs succeeded (for manual intervention)
  throw new Error('Partial commit - manual intervention required');
}
```

**Rollback:**
- ✅ Automatic during operations phase
- ✅ Automatic for uncommitted databases during commit phase
- ⚠️ Manual intervention needed if commit partially succeeds (rare but possible)

**Trade-offs:**
- ⚡ **Slower**: Sequential commits (adds ~5-10ms per database)
- 🔒 **Safer**: Detects commit failures before persisting to all databases
- ⚠️ **Still not perfect**: MongoDB doesn't have true distributed transactions

**When to Use:**
- Financial transactions
- Order processing
- Inventory management
- Critical business operations
- Regulatory compliance scenarios
- When data consistency is paramount

---

## Real-World Examples

### Example 1: E-Commerce Order (Use 2PC)

```typescript
// CRITICAL: Order + Inventory must be consistent
const result = await withTwoPhaseCommit(
  [
    { name: 'ORDERS', connection: ordersConn },
    { name: 'INVENTORY', connection: inventoryConn },
    { name: 'PAYMENTS', connection: paymentsConn }
  ],
  async (txn) => {
    const ordersSession = txn.getSession('ORDERS');
    const inventorySession = txn.getSession('INVENTORY');
    const paymentsSession = txn.getSession('PAYMENTS');

    // 1. Create order
    const [order] = await Order.create([{
      userId,
      items,
      total: 99.99
    }], { session: ordersSession });

    // 2. Decrement inventory
    for (const item of items) {
      const inventory = await Inventory.findByIdAndUpdate(
        item.productId,
        { $inc: { quantity: -item.quantity } },
        { session: inventorySession, new: true }
      );

      if (inventory.quantity < 0) {
        throw new Error('Insufficient inventory');
      }
    }

    // 3. Record payment
    await Payment.create([{
      orderId: order._id,
      amount: 99.99,
      status: 'completed'
    }], { session: paymentsSession });

    return order;
  }
);

if (!result.success) {
  // All databases rolled back - order cancelled, inventory restored
  return { error: 'Order failed', reason: result.error.message };
}

return { order: result.data };
```

**Why 2PC?** Inventory and payment must be consistent with order.

---

### Example 2: User Registration with Audit (Use Parallel)

```typescript
// NON-CRITICAL: Audit log can be missing
const result = await withCrossDbTransaction(
  [
    { name: 'APP', connection: appConn },
    { name: 'AUDIT', connection: auditConn }
  ],
  async (txn) => {
    const appSession = txn.getSession('APP');
    const auditSession = txn.getSession('AUDIT');

    // Create user (critical)
    const [user] = await User.create([userData], { session: appSession });

    // Log audit (nice to have)
    await AuditLog.create([{
      action: 'USER_REGISTERED',
      userId: user._id,
      timestamp: new Date()
    }], { session: auditSession });

    return user;
  }
);

// If audit log fails, user is still created (acceptable)
```

**Why Parallel?** Performance matters, missing audit log is acceptable.

---

### Example 3: Banking Transfer (Use 2PC)

```typescript
// CRITICAL: Money must not be lost or duplicated
const result = await withTwoPhaseCommit(
  [
    { name: 'ACCOUNTS', connection: accountsConn },
    { name: 'TRANSACTIONS', connection: transactionsConn }
  ],
  async (txn) => {
    const accountsSession = txn.getSession('ACCOUNTS');
    const transactionsSession = txn.getSession('TRANSACTIONS');

    // 1. Deduct from sender
    const sender = await Account.findByIdAndUpdate(
      senderId,
      { $inc: { balance: -amount } },
      { session: accountsSession, new: true }
    );

    if (sender.balance < 0) {
      throw new Error('Insufficient funds');
    }

    // 2. Add to receiver
    await Account.findByIdAndUpdate(
      receiverId,
      { $inc: { balance: amount } },
      { session: accountsSession }
    );

    // 3. Record transaction
    await Transaction.create([{
      from: senderId,
      to: receiverId,
      amount,
      timestamp: new Date()
    }], { session: transactionsSession });
  }
);
```

**Why 2PC?** Financial integrity is critical - money must not be lost.

---

## Decision Tree

```
Is it a single database?
├─ YES → Use withTransaction() ✅
└─ NO → Is data consistency critical?
    ├─ YES → Use withTwoPhaseCommit() ✅
    └─ NO → Use withCrossDbTransaction() ⚡
```

### Critical Operations (Use 2PC):
- Financial transactions
- Order processing
- Inventory management
- User authentication state
- Payment processing
- Medical records
- Legal documents

### Non-Critical Operations (Use Parallel):
- Audit logging
- Analytics events
- Search index updates
- Cache invalidation
- Notification queuing
- Metrics collection

---

## Handling Failures

### Parallel Transaction Failure

```typescript
const result = await withCrossDbTransaction(
  connections,
  async (txn) => { /* operations */ }
);

if (!result.success) {
  // All databases rolled back (during operations phase)
  // OR some succeeded, some failed (during commit phase)

  console.error('Transaction failed:', result.error);

  // Log for investigation
  await logger.error({
    type: 'CROSS_DB_TRANSACTION_FAILURE',
    error: result.error,
    attempts: result.attempts
  });

  // Return error to user
  throw new Error('Operation failed');
}
```

### Two-Phase Commit Failure

```typescript
const result = await withTwoPhaseCommit(
  connections,
  async (txn) => { /* operations */ }
);

if (!result.success) {
  if (result.error.message.includes('Partial commit failure')) {
    // CRITICAL: Manual intervention needed
    await alertOps({
      severity: 'CRITICAL',
      message: 'Partial commit detected',
      error: result.error.message,
      databases: connections.map(c => c.name)
    });

    // The error message includes which DBs succeeded
    // Use this for manual reconciliation
  }

  throw result.error;
}
```

---

## Best Practices

### 1. Choose the Right Strategy

```typescript
// ✅ GOOD: Use appropriate strategy
await withTwoPhaseCommit(...)        // For critical data
await withCrossDbTransaction(...)    // For non-critical data
await withTransaction(...)           // For single DB

// ❌ BAD: Using parallel for critical data
await withCrossDbTransaction(...)    // For financial data ⚠️
```

### 2. Handle Errors Properly

```typescript
// ✅ GOOD: Check result.success
const result = await withTwoPhaseCommit(...);
if (!result.success) {
  throw result.error;
}

// ❌ BAD: Ignore errors
await withTwoPhaseCommit(...);       // Might fail silently
```

### 3. Set Appropriate Timeouts

```typescript
// ✅ GOOD: Longer timeout for complex operations
await withTwoPhaseCommit(
  connections,
  async (txn) => { /* complex ops */ },
  { timeout: 60000 } // 60 seconds
);

// ❌ BAD: Default timeout for slow operations
await withTwoPhaseCommit(...)        // 30s default might be too short
```

### 4. Monitor Transaction Metrics

```typescript
// ✅ GOOD: Track transaction performance
const start = Date.now();
const result = await withTwoPhaseCommit(...);
const duration = Date.now() - start;

await metrics.record({
  type: '2PC_TRANSACTION',
  duration,
  success: result.success,
  attempts: result.attempts
});
```

---

## Limitations & Workarounds

### Limitation 1: No True Distributed Transactions

**Problem**: MongoDB doesn't support XA transactions across separate instances.

**Workarounds**:
1. Use 2PC for stronger guarantees (best effort)
2. Use Saga pattern for eventual consistency
3. Keep related data in same database
4. Use distributed transaction coordinator (e.g., Apache Kafka, AWS Step Functions)

### Limitation 2: Partial Commit Possible

**Problem**: Even with 2PC, partial commits can occur (network failures during commit phase).

**Workarounds**:
1. Implement idempotent operations
2. Add manual reconciliation procedures
3. Use event sourcing for audit trail
4. Monitor for partial failures and alert ops team

### Limitation 3: Performance Impact

**Problem**: 2PC is slower due to sequential commits.

**Workarounds**:
1. Use parallel transactions for non-critical data
2. Batch operations where possible
3. Optimize query performance
4. Scale databases independently

---

## Migration from Parallel to 2PC

If you're currently using parallel transactions and need stronger guarantees:

```typescript
// Before (parallel - fast but risky)
await withCrossDbTransaction(
  connections,
  async (txn) => { /* operations */ }
);

// After (2PC - slower but safer)
await withTwoPhaseCommit(
  connections,
  async (txn) => { /* same operations */ },
  {
    maxRetries: 5,        // Increase retries
    timeout: 60000        // Increase timeout
  }
);
```

**Performance Impact**: ~5-10ms per additional database

---

## Summary

### Single Database: ✅ Full ACID
```typescript
withTransaction(connection, async (session) => {
  // ACID guaranteed
});
```

### Cross-Database Parallel: ⚠️ Best Effort
```typescript
withCrossDbTransaction(connections, async (txn) => {
  // Fast but risky
});
```

### Cross-Database 2PC: ✅ Strong ACID
```typescript
withTwoPhaseCommit(connections, async (txn) => {
  // Slower but safer
});
```

**Choose based on your data criticality requirements.**

---

## Additional Resources

- [MongoDB Transactions Documentation](https://docs.mongodb.com/manual/core/transactions/)
- [Two-Phase Commit Pattern](https://www.mongodb.com/docs/manual/tutorial/perform-two-phase-commits/)
- [Saga Pattern for Distributed Transactions](https://microservices.io/patterns/data/saga.html)
- [CAP Theorem Explained](https://en.wikipedia.org/wiki/CAP_theorem)
