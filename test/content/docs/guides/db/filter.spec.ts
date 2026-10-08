// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

// Snippets for src/content/docs/guides/db/filter.mdx
//
// The region "app" is the sample application of the tutorial. It runs when
// vitest imports this file. The tests below check what it has built.

// #region app
// #region view
import { writeGolden } from '@tssuite/golden';
import { ColumnSelection } from '@rljson/db';
import { carWorldDb, column } from './car-world-db';
// #endregion view
// #region number
import type { NumberFilter, RowFilter } from '@rljson/db';
import { hip } from '@rljson/hash';
// #endregion number
// #region and
import type { StringFilter } from '@rljson/db';
// #endregion and
// #endregion app

import { describe, expect, it } from 'vitest';

// #region app
// #region view
const { db, catalogRef } = await carWorldDb();

const catalogView = new ColumnSelection([
  column('model', 'carBrands/brands/model'),
  column('body', 'carBrands/brands/bodyType'),
  column('fuel', 'carBrands/brands/fuel'),
  column('price', 'carPrices/prices/amount', 'number'),
]);
const catalog = await db.join(catalogView, 'catalogs', catalogRef);
await writeGolden('catalog.md', catalog.markdown());
// #endregion view

// #region number
// A column filter names the route of its column, an operator and a value
const expensive: NumberFilter = {
  type: 'number',
  column: 'catalogs/carPrices/prices/amount',
  operator: 'greaterThan',
  search: 50000,
  _hash: '',
};

// A row filter combines column filters
const expensiveCars = hip<RowFilter>({
  columnFilters: [expensive],
  operator: 'and',
  _hash: '',
});

const expensiveView = catalog.clone().filter(expensiveCars);
await writeGolden('expensive.md', expensiveView.markdown());
// #endregion number

// #region and
const diesel: StringFilter = {
  type: 'string',
  column: 'catalogs/carBrands/brands/fuel',
  operator: 'equals',
  search: 'diesel',
  _hash: '',
};

const suv: StringFilter = {
  type: 'string',
  column: 'catalogs/carBrands/brands/bodyType',
  operator: 'equals',
  search: 'suv',
  _hash: '',
};

// "and" keeps the rows every filter matches
const dieselSuvs = hip<RowFilter>({
  columnFilters: [diesel, suv],
  operator: 'and',
  _hash: '',
});
const dieselSuvView = catalog.clone().filter(dieselSuvs);
await writeGolden('diesel-and-suv.md', dieselSuvView.markdown());
// #endregion and

// #region or

// "or" keeps the rows any filter matches
const dieselOrSuv = hip<RowFilter>({
  columnFilters: [diesel, suv],
  operator: 'or',
  _hash: '',
});
const dieselOrSuvView = catalog.clone().filter(dieselOrSuv);
await writeGolden('diesel-or-suv.md', dieselOrSuvView.markdown());
// #endregion or
// #endregion app

describe('Filter tutorial', () => {
  it('keeps the full view untouched', () => {
    expect(catalog.rowCount).toBe(5);
  });

  it('filters by price', () => {
    const rows = catalog.clone().filter(expensiveCars).rows;
    expect(rows.every((row) => row[3][0] > 50000)).toBe(true);
  });

  it('keeps more rows with or than with and', () => {
    expect(dieselOrSuvView.rowCount).toBeGreaterThanOrEqual(
      dieselSuvView.rowCount,
    );
  });
});
