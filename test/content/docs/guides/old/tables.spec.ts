// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

// Snippets for src/content/docs/guides/tables.mdx

// #region remove-duplicates
import { hip } from '@rljson/hash';
import { removeDuplicates, type Rljson } from '@rljson/rljson';
// #endregion remove-duplicates

import { describe, expect, it } from 'vitest';

describe('Tables, rows and hashes', () => {
  it('Removing duplicates: keeps one row per hash', () => {
    // #region remove-duplicates
    const rljson: Rljson = hip({
      ingredients: {
        _type: 'components',
        _data: [
          { id: 'flour', amountUnit: 'g' },
          { id: 'flour', amountUnit: 'g' },
        ],
      },
    });

    const deduped = removeDuplicates(rljson);

    expect(deduped.ingredients._data).toHaveLength(1);
    // #endregion remove-duplicates
  });
});
