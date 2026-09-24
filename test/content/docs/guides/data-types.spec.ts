// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

// Snippets for src/content/docs/guides/data-types.mdx

// #region components
import { hip } from '@rljson/hash';
import type { ComponentsTable } from '@rljson/rljson';
// #endregion components

// #region slice-ids
import type { SliceIdsTable } from '@rljson/rljson';
// #endregion slice-ids

// #region layers
import type { Layer, LayersTable } from '@rljson/rljson';
// #endregion layers

// #region cakes
import type { Cake, CakesTable } from '@rljson/rljson';
// #endregion cakes

// #region buffets
import type { Buffet, BuffetsTable } from '@rljson/rljson';
// #endregion buffets

// #region trees
import { treeFromObject } from '@rljson/rljson';
// #endregion trees

import {
  BaseValidator,
  exampleBuffetsTable,
  exampleCakesTable,
  exampleLayersTable,
  type Rljson,
} from '@rljson/rljson';
import { describe, expect, it } from 'vitest';

describe('Data types', () => {
  const errorsOf = (rljson: Rljson) => new BaseValidator().validateSync(rljson);

  it('Components: hash every row', async () => {
    // #region components
    type Ingredient = { id: string; amountUnit: string };

    const ingredients: ComponentsTable<Ingredient> = hip({
      _type: 'components',
      _data: [
        { id: 'flour', amountUnit: 'g' },
        { id: 'sugar', amountUnit: 'g' },
      ],
    });
    // #endregion components

    await expect(JSON.stringify(ingredients, null, 2)).toMatchFileSnapshot(
      '../../../goldens/guides/data-types/components.json',
    );
    expect(errorsOf({ ingredients })).toEqual({ hasErrors: false });
  });

  it('SliceIds: list the slice ids of a layer', () => {
    // #region slice-ids
    const slices: SliceIdsTable = {
      _type: 'sliceIds',
      _data: [{ add: ['slice0', 'slice1'], remove: [] }],
    };
    // #endregion slice-ids

    expect(errorsOf({ slices })).toEqual({ hasErrors: false });
  });

  it('Layers: assign components to slice ids', () => {
    const layers: LayersTable = exampleLayersTable();
    const layer: Layer = layers._data[0];

    expect(Object.keys(layer)).toEqual(
      expect.arrayContaining(['componentsTable', 'sliceIdsTable', 'add']),
    );
  });

  it('Cakes: stack layers over the same slice ids', () => {
    const cakes: CakesTable = exampleCakesTable();
    const cake: Cake = cakes._data[0];

    expect(Object.keys(cake)).toEqual(
      expect.arrayContaining(['sliceIdsTable', 'layers']),
    );
  });

  it('Buffets: reference rows of any other table', () => {
    const buffets: BuffetsTable = exampleBuffetsTable();
    const buffet: Buffet = buffets._data[0];

    expect(Object.keys(buffet.items[0])).toEqual(
      expect.arrayContaining(['table', 'ref']),
    );
  });

  it('Trees: turn a plain object into hashed nodes', async () => {
    // #region trees
    // Convert a plain object into hashed tree nodes
    const nodes = treeFromObject({
      src: { 'index.ts': 'console.log("hello")' },
    });
    // #endregion trees

    await expect(JSON.stringify(nodes, null, 2)).toMatchFileSnapshot(
      '../../../goldens/guides/data-types/trees.json',
    );
    expect(errorsOf({ trees: { _type: 'trees', _data: nodes } })).toEqual({
      hasErrors: false,
    });
  });
});
