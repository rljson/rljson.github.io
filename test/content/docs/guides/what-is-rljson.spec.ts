// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

// Output and claims for src/content/docs/guides/what-is-rljson.mdx

import { hip } from '@rljson/hash';
import type { ComponentsTable } from '@rljson/rljson';
import { describe, expect, it } from 'vitest';

describe('What is Rljson?', () => {
  type Ingredient = { id: string; amountUnit: string; _hash?: string };

  const ingredients = (sugarUnit: string) =>
    hip<ComponentsTable<Ingredient>>({
      _type: 'components',
      _data: [
        { id: 'flour', amountUnit: 'g' },
        { id: 'sugar', amountUnit: sugarUnit },
      ],
    });

  it('A first look: hashes each row and the table', async () => {
    await expect(
      JSON.stringify({ ingredients: ingredients('g') }, null, 2),
    ).toMatchFileSnapshot(
      '../../../goldens/guides/what-is-rljson/first-look.json',
    );
  });

  it('changes only the hashes of a changed row and above', () => {
    const before = ingredients('g');
    const after = ingredients('kg');

    expect(after._data[0]._hash).toBe(before._data[0]._hash); // flour
    expect(after._data[1]._hash).not.toBe(before._data[1]._hash); // sugar
    expect(after._hash).not.toBe(before._hash); // the table
  });
});
