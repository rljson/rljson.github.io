// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

// Snippets for src/content/docs/guides/edit-protocol.mdx

// #region insert
import { type Insert, validateInsert } from '@rljson/rljson';
// #endregion insert

// #region insert-history
import type { InsertHistoryRow } from '@rljson/rljson';
// #endregion insert-history

// #region time-id
import { getTimeIdTimestamp, isTimeId, timeId } from '@rljson/rljson';
// #endregion time-id

import { hip } from '@rljson/hash';
import { isClientId } from '@rljson/rljson';
import { describe, expect, it } from 'vitest';

describe('Edit protocol', () => {
  it('Insert: describes a change and passes validation', () => {
    // #region insert
    type Ingredient = { name: string; amountUnit: string };

    const insert: Insert<Ingredient> = {
      route: '/ingredients',
      command: 'add',
      value: { name: 'butter', amountUnit: 'g' },
    };

    const errors = validateInsert(insert);

    expect(errors).toEqual({ hasErrors: false });
    // #endregion insert
  });

  it('InsertHistory: records an insert and its predecessors', () => {
    // #region insert-history
    const row: InsertHistoryRow<'ingredients'> = {
      ingredientsRef: 'MBcC3ciKN8PCXzrH-zS2dZ',
      timeId: '1700000000000:AbCd',
      route: '/ingredients',
      origin: 'client_ExAmPlE12345',
      previous: ['1699999999999:ZzZz'],
      clientTimestamp: 1700000000000,
    };
    // #endregion insert-history

    // The ref is the hash of the flour row the other pages use
    expect(hip({ id: 'flour', amountUnit: 'g' })).toHaveProperty(
      '_hash',
      row.ingredientsRef,
    );

    // The example ids are well formed
    expect(isClientId(row.origin ?? '')).toBe(true);
    expect([row.timeId, ...(row.previous ?? [])].every(isTimeId)).toBe(true);
  });

  it('TimeId: creates unique, time-based ids', () => {
    // #region time-id
    const id = timeId();

    expect(isTimeId(id)).toBe(true);
    expect(getTimeIdTimestamp('1700000000000:AbCd')).toBe(1700000000000);
    // #endregion time-id
  });
});
