// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

// Snippets for src/content/docs/guides/db/joins-views.mdx
//
// The region "app" is the sample application of the tutorial. It runs when
// vitest imports this file. The tests below check what it has built.

// #region app
// #region select
import { writeGolden } from '@tssuite/golden';
import { ColumnSelection } from '@rljson/db';
import { carWorldDb, column } from './car-world-db';
// #endregion select
// #endregion app

import { describe, expect, it } from 'vitest';

// #region app
// #region select
const { db, catalogRef } = await carWorldDb();

// The catalog view: one row per car, one column per route
const catalogView = new ColumnSelection([
  column('brand', 'carBrands/brands/brand'),
  column('model', 'carBrands/brands/model'),
  column('price', 'carPrices/prices/amount', 'number'),
  column('currency', 'carPrices/prices/currency'),
]);
// #endregion select

// #region join
// Join the catalog with the selection
const catalog = await db.join(catalogView, 'catalogs', catalogRef);
const summary = `${catalog.rowCount} cars, ${catalog.columnCount} columns`;
await writeGolden('catalog.md', `${summary}\n\n${catalog.markdown()}`);
// #endregion join

// #region references
// A route continues through the references of a component: the workshop
// of a car refers to its address and to its owner
const serviceView = new ColumnSelection([
  column('model', 'carBrands/brands/model'),
  column('workshop', 'carWorkshops/workshops/name'),
  column('street', 'carWorkshops/workshops/addresses/street'),
  column('city', 'carWorkshops/workshops/addresses/city'),
  column('firstName', 'carWorkshops/workshops/persons/firstName'),
  column('lastName', 'carWorkshops/workshops/persons/lastName'),
]);
const service = await db.join(serviceView, 'catalogs', catalogRef);
await writeGolden('service.md', service.markdown());
// #endregion references

// #region parts
// The parts layer assigns a bill of materials to every car
const partsView = new ColumnSelection([
  column('model', 'carBrands/brands/model'),
  column('bill', 'carParts/parts/name'),
  column('weight', 'carParts/parts/weightKg', 'number'),
]);
const parts = await db.join(partsView, 'catalogs', catalogRef);
await writeGolden('parts.md', parts.markdown());
// #endregion parts
// #endregion app

describe('Joins & views tutorial', () => {
  it('joins one row per car', () => {
    expect(catalog.rowCount).toBe(5);
    expect(catalog.columnCount).toBe(4);
  });

  it('follows the workshop to its address and owner', () => {
    for (const row of service.rows) {
      expect(row[3]).toHaveLength(1);
      expect(row[5]).toHaveLength(1);
    }
  });

  it('joins one bill of materials per car', () => {
    expect(summary).toBe('5 cars, 4 columns');
    expect(parts.rowCount).toBe(5);
  });
});
