---
title: Sync protocol
description: The wire protocol types shared by Connector, Server and Client.
---

The `sync/` module of `@rljson/rljson` defines the wire-protocol types used by
the messaging layer of [`@rljson/db`](https://github.com/rljson/db)
(Connector) and [`@rljson/server`](https://github.com/rljson/server).

## ConnectorPayload

The payload transmitted between Connector and Server.

```typescript
import { ConnectorPayload } from '@rljson/rljson';

// Minimal — backward compatible
const legacy: ConnectorPayload = { o: 'origin', r: 'ref' };

// Fully enriched
const enriched: ConnectorPayload = {
  o: 'origin', // ephemeral origin (self-echo filter)
  r: 'ref', // the ref being announced
  c: 'client_abc123...', // stable client identity
  t: Date.now(), // client-side timestamp
  seq: 42, // monotonic sequence number
  p: ['prev-timeId'], // causal predecessors
  cksum: 'sha256:...', // content checksum
};
```

## AckPayload

The server's acknowledgment that all — or some — receivers got a ref.

```typescript
import { AckPayload } from '@rljson/rljson';

const ack: AckPayload = {
  r: 'ref',
  ok: true,
  receivedBy: 3,
  totalClients: 3,
};
```

## GapFill

When a client detects a gap in the sequence, it asks for the missing refs.

```typescript
import { GapFillRequest, GapFillResponse } from '@rljson/rljson';

const request: GapFillRequest = {
  route: '/sharedTree',
  afterSeq: 5,
};
```

## SyncConfig

Feature flags to opt into hardened sync behavior. All flags are optional and
default to off.

```typescript
import { SyncConfig } from '@rljson/rljson';

const config: SyncConfig = {
  causalOrdering: true, // track predecessors and detect gaps
  requireAck: true, // wait for the server ACK after sending
  ackTimeoutMs: 5_000, // ACK timeout
  includeClientIdentity: true, // attach clientId and timestamp
  maxDedupSetSize: 10_000, // max refs per dedup generation
  bootstrapHeartbeatMs: 30_000, // periodic bootstrap heartbeat
};
```

## SyncEventNames

`syncEvents` generates typed, route-specific socket event names:

```typescript
import { syncEvents } from '@rljson/rljson';

const events = syncEvents('/sharedTree');
// events.ref        → '/sharedTree'
// events.ack        → '/sharedTree:ack'
// events.ackClient  → '/sharedTree:ack:client'
// events.gapFillReq → '/sharedTree:gapfill:req'
// events.gapFillRes → '/sharedTree:gapfill:res'
// events.bootstrap  → '/sharedTree:bootstrap'
```

## ClientId

A stable client identity that survives reconnections, unlike the ephemeral
Connector origin.

```typescript
import { clientId, isClientId } from '@rljson/rljson';

const id = clientId(); // 'client_V1StGXR8_Z5j'
isClientId(id); // true
isClientId('not-a-client-id'); // false
```

## Conflict detection

A conflict occurs when the InsertHistory of a table has diverged into several
branches — multiple tips that are not ancestors of each other — which means
concurrent writes from different clients.

These types signal that a conflict exists. They do not resolve it: resolution
is left to the application.

```typescript
import type { Conflict, ConflictCallback, ConflictType } from '@rljson/rljson';

const conflict: Conflict = {
  table: 'cars', // where the conflict was detected
  type: 'dagBranch', // currently the only conflict type
  detectedAt: Date.now(), // ms since epoch
  branches: ['17000…:AbCd', '17000…:EfGh'], // the InsertHistory tips
};

const onConflict: ConflictCallback = (conflict: Conflict) => {
  console.log(`Conflict in ${conflict.table}:`, conflict.branches);
};
```
