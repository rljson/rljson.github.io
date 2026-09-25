// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

// Snippets for src/content/docs/guides/sync-protocol.mdx

// #region connector-payload
import type { ConnectorPayload } from '@rljson/rljson';
// #endregion connector-payload

// #region ack-payload
import type { AckPayload } from '@rljson/rljson';
// #endregion ack-payload

// #region gap-fill
import type { GapFillRequest } from '@rljson/rljson';
// #endregion gap-fill

// #region sync-config
import type { SyncConfig } from '@rljson/rljson';
// #endregion sync-config

// #region sync-events
import { syncEvents } from '@rljson/rljson';
// #endregion sync-events

// #region client-id
import { clientId, isClientId } from '@rljson/rljson';
// #endregion client-id

// #region conflict
import type { Conflict, ConflictCallback } from '@rljson/rljson';
// #endregion conflict

import {
  ackPayloadExample,
  connectorPayloadFullExample,
  isTimeId,
  syncConfigDefault,
  syncConfigFullExample,
} from '@rljson/rljson';
import { writeGolden } from '@tssuite/golden';
import { describe, expect, it, vi } from 'vitest';

describe('Sync protocol', () => {
  it('ConnectorPayload: is minimal or fully enriched', () => {
    // #region connector-payload

    // Minimal — backward compatible
    const legacy: ConnectorPayload = {
      o: '1700000000000:AbCd',
      r: '1700000000001:EfGh',
    };

    // Fully enriched
    const enriched: ConnectorPayload = {
      o: '1700000000000:AbCd', // ephemeral origin (self-echo filter)
      r: '1700000000001:EfGh', // the ref being announced
      c: 'client_ExAmPlE12345', // stable client identity
      t: Date.now(), // client-side timestamp
      seq: 42, // monotonic sequence number
      p: ['1699999999999:ZzZz'], // causal predecessors
      cksum: 'sha256:abc123def456', // content checksum
    };
    // #endregion connector-payload

    // The enriched payload shows every field the package knows
    expect(Object.keys(enriched).sort()).toEqual(
      Object.keys(connectorPayloadFullExample()).sort(),
    );

    // The example ids are well formed
    expect(isClientId(enriched.c ?? '')).toBe(true);
    const timeIds = [legacy.o, legacy.r, ...(enriched.p ?? [])];
    expect(timeIds.every(isTimeId)).toBe(true);
  });

  it('AckPayload: confirms that all receivers got a ref', () => {
    // #region ack-payload
    const ack: AckPayload = {
      r: '1700000000001:EfGh',
      ok: true,
      receivedBy: 3,
      totalClients: 3,
    };
    // #endregion ack-payload

    expect(Object.keys(ack).sort()).toEqual(
      Object.keys(ackPayloadExample()).sort(),
    );
  });

  it('GapFill: asks for the refs after a sequence number', () => {
    // #region gap-fill
    const request: GapFillRequest = {
      route: '/sharedTree',
      afterSeq: 5,
    };
    // #endregion gap-fill

    // The request travels on the gap fill event of its route
    expect(syncEvents(request.route).gapFillReq).toBe(
      '/sharedTree:gapfill:req',
    );
  });

  it('SyncConfig: opts into all hardening flags', () => {
    // #region sync-config
    const config: SyncConfig = {
      causalOrdering: true, // track predecessors and detect gaps
      requireAck: true, // wait for the server ACK after sending
      ackTimeoutMs: 5_000, // ACK timeout
      includeClientIdentity: true, // attach clientId and timestamp
      maxDedupSetSize: 10_000, // max refs per dedup generation
      bootstrapHeartbeatMs: 30_000, // periodic bootstrap heartbeat
    };
    // #endregion sync-config

    // All flags are optional and default to off
    expect(syncConfigDefault()).toEqual({});

    // The example covers every flag of the package's full example
    expect(Object.keys(config)).toEqual(
      expect.arrayContaining(Object.keys(syncConfigFullExample())),
    );
  });

  it('SyncEventNames: derives the event names of a route', async () => {
    // #region sync-events
    const events = syncEvents('/sharedTree');
    // #endregion sync-events

    await writeGolden('sync-events.json', events);
  });

  it('ClientId: creates a stable client identity', () => {
    // #region client-id
    const id = clientId();

    expect(isClientId(id)).toBe(true);
    expect(isClientId('not-a-client-id')).toBe(false);
    // #endregion client-id
  });

  it('Conflict detection: reports the branches of a table', () => {
    // #region conflict
    const conflict: Conflict = {
      table: 'cars', // where the conflict was detected
      type: 'dagBranch', // currently the only conflict type
      detectedAt: Date.now(), // ms since epoch
      branches: ['1700000000000:AbCd', '1700000000001:EfGh'], // the InsertHistory tips
    };

    const onConflict: ConflictCallback = (conflict: Conflict) => {
      console.log(`Conflict in ${conflict.table}:`, conflict.branches);
    };
    // #endregion conflict

    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    onConflict(conflict);
    expect(log).toHaveBeenCalledWith('Conflict in cars:', conflict.branches);
    log.mockRestore();

    expect(conflict.branches.every(isTimeId)).toBe(true);
  });
});
