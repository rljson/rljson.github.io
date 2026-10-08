// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

// Snippets for src/content/docs/guides/db/mass-edit.mdx
//
// The region "app" is the sample application of the tutorial. It runs when
// vitest imports this file. The tests below check what it has built.

// #region app
// #region tables
import { writeGolden } from '@tssuite/golden';
import { carWorldDb, column } from './car-world-db';
import {
  createEditHistoryTableCfg,
  createEditTableCfg,
  createMultiEditTableCfg,
} from '@rljson/rljson';
// #endregion tables
// #region manager
import { MultiEditManager } from '@rljson/db';
// #endregion manager
// #region select
import type { EditColumnSelection } from '@rljson/db';
import { hip } from '@rljson/hash';
// #endregion select
// #region filter
import type { EditRowFilter } from '@rljson/db';
// #endregion filter
// #region setValue
import type { EditSetValue } from '@rljson/db';
// #endregion setValue
// #region untouched
import { Route } from '@rljson/rljson';
// #endregion untouched
// #region publish
import { ColumnSelection } from '@rljson/db';
// #endregion publish
// #endregion app

import { describe, expect, it } from 'vitest';

// #region app
// #region tables
const { db, catalogRef } = await carWorldDb();

// Edits are data too: three tables per cake store them
await db.core.createTable(createEditTableCfg('catalogs'));
await db.core.createTable(createMultiEditTableCfg('catalogs'));
await db.core.createTable(createEditHistoryTableCfg('catalogs'));
// #endregion tables

// #region manager
// The manager keeps the edits of one cake and the view they produce
const manager = new MultiEditManager('catalogs', db);
manager.init();
// #endregion manager

// #region select
// The first edit selects the columns of the view. It starts at the catalog.
const select = hip<EditColumnSelection>({
  name: 'Show model, fuel, price and discount',
  action: {
    name: 'Select',
    type: 'selection',
    data: {
      columns: [
        column('model', 'carBrands/brands/model'),
        column('fuel', 'carBrands/brands/fuel'),
        column('price', 'carPrices/prices/amount', 'number'),
        column('discount', 'carPrices/prices/discountPercent', 'number'),
      ],
    },
    _hash: '',
  },
  _hash: '',
});
await manager.edit(select, catalogRef);

await writeGolden('before.txt', manager.join.formatView());
// #endregion select

// #region filter
// The second edit narrows the view to the cars above 50000
const filter = hip<EditRowFilter>({
  name: 'Price above 50000',
  action: {
    name: 'Filter',
    type: 'filter',
    data: {
      columnFilters: [
        {
          type: 'number',
          column: 'catalogs/carPrices/prices/amount',
          operator: 'greaterThan',
          search: 50000,
          _hash: '',
        },
      ],
      operator: 'and',
      _hash: '',
    },
    _hash: '',
  },
  _hash: '',
});
await manager.edit(filter);
// #endregion filter

// #region setValue
// The third edit sets the discount of every row the view still shows
const discount = hip<EditSetValue>({
  name: 'Give 10 % discount',
  action: {
    name: 'Set discount',
    type: 'setValue',
    data: {
      route: 'catalogs/carPrices/prices/discountPercent',
      value: 10,
    },
    _hash: '',
  },
  _hash: '',
});
await manager.edit(discount);

await writeGolden('after.txt', manager.join.formatView());
// #endregion setValue

// #region untouched
// The edits have not changed the data: the catalog is still the same
const discounts = Route.fromFlat(
  `catalogs@${catalogRef}/carPrices/prices/discountPercent`,
);
const { cell: before } = await db.get(discounts, {});
const stored = `Stored discounts: ${before.map((c) => c.value).join(', ')}`;
await writeGolden('stored.txt', stored);
// #endregion untouched

// #region publish
// Publish writes the edits into new rows and returns the new catalog. The
// new catalog is complete: it keeps all cars, also those the filter hid.
const published = await manager.publish();

const catalogView = new ColumnSelection([
  column('model', 'carBrands/brands/model'),
  column('price', 'carPrices/prices/amount', 'number'),
  column('discount', 'carPrices/prices/discountPercent', 'number'),
]);
const publishedCatalog = await db.join(
  catalogView,
  'catalogs',
  published.cakeRef,
);
await writeGolden(
  'published.txt',
  `New catalog: ${published.cakeRef !== catalogRef}\n\n` +
    publishedCatalog.formatView(),
);
// #endregion publish
// #endregion app

describe('Mass edit tutorial', () => {
  it('edits only the filtered rows', async () => {
    const rows = manager.join.rows;
    expect(rows).toHaveLength(3);
    expect(rows.every((row) => row[3][0] === 10)).toBe(true);
  });

  it('keeps the stored data until publish', () => {
    expect(before.every((c) => c.value === 0)).toBe(true);
  });

  it('publishes a complete catalog', () => {
    const discounts = publishedCatalog.rows.map((row) => row[2][0]);
    expect(discounts).toEqual([0, 0, 10, 10, 10]);
  });

  it('publishes into a new catalog', () => {
    expect(published.cakeRef).not.toBe(catalogRef);
  });
});
