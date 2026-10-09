// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

// Snippets for src/content/docs/guides/db/single-edit.mdx
//
// The region "app" is the sample application of the tutorial. It runs when
// vitest imports this file. The tests below check what it has built.

// #region app
// #region get
import { writeGolden } from '@tssuite/golden';
import { carWorldDb } from './car-world-db';
import { Route } from '@rljson/rljson';
import type { EPrice } from '@rljson/edge';
// #endregion get
// #region component
import { inject, isolate } from '@rljson/db';
// #endregion component
// #endregion app

import { describe, expect, it } from 'vitest';

// #region app
// #region get
const { db, catalogRef } = await carWorldDb();

// Read the price of one car. The route leads from the catalog through the
// prices layer to the prices; Db returns one cell per car.
const carId = 'velora-cars-000001';
const priceOf = async (ref: string) => {
  const route = Route.fromFlat(`catalogs@${ref}/carPrices/prices`);
  const { cell } = await db.get(route, {});
  return cell.find((c) => c.path[0].includes(carId))!.row as EPrice;
};

const price = await priceOf(catalogRef);
await writeGolden(
  'price.txt',
  `${carId} costs ${price.amount} ${price.currency}`,
);
// #endregion get

// #region component
// Get the prices of the catalog. The tree holds the rows, the path of the
// cell points to the price of the car.
const route = Route.fromFlat(`catalogs@${catalogRef}/carPrices/prices`);
const { tree, cell } = await db.get(route, {});
const [path] = cell.find((c) => c.path[0].includes(carId))!.path;

// isolate copies the tree along the path, inject replaces the price
const insert = isolate(tree, path);
inject(insert, path, { ...price, amount: 17990, _hash: '' });

// Insert on the route of the catalog: Db writes a new price, a new prices
// layer on top of the old one and a new catalog with all other layers
const [{ catalogsRef: newCatalogRef }] = await db.insert(route, insert);
await writeGolden('new-catalog.txt', `New catalog: ${newCatalogRef}`);
// #endregion component

// #region read
// The old catalog keeps the old price, the new one has the new price
const before = await priceOf(catalogRef);
const after = await priceOf(newCatalogRef);
await writeGolden(
  'compare.txt',
  `Old catalog: ${before.amount}, new catalog: ${after.amount}`,
);
// #endregion read

// #region history
// The insert is recorded in the insert history of the catalogs, with the
// route it was made on
const history = await db.getInsertHistory('catalogs');
const inserts = history.catalogsInsertHistory._data.map(
  (row) => `${row.route} -> ${row.catalogsRef}`,
);
await writeGolden('insert-history.txt', inserts.join('\n'));
// #endregion history
// #endregion app

describe('Single edit tutorial', () => {
  it('changes the price in a new catalog', () => {
    expect(newCatalogRef).not.toBe(catalogRef);
    expect(before.amount).toBe(price.amount);
    expect(after.amount).toBe(17990);
  });

  it('keeps the other cars', async () => {
    const route = Route.fromFlat(
      `catalogs@${newCatalogRef}/carBrands/brands/model`,
    );
    const { cell } = await db.get(route, {});
    expect(cell).toHaveLength(5);
  });

  it('records the insert on the route', () => {
    expect(inserts).toHaveLength(1);
    expect(inserts[0]).toContain('/carPrices/prices');
  });
});
