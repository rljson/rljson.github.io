// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

// Snippets for src/content/docs/guides/db/import.mdx
//
// The region "app" is the sample application of the tutorial. It runs when
// vitest imports this file. The tests below check what it has built.
// Generating and importing the world is shown from car-world-db.ts.

// #region app
// #region setup
import { writeGolden } from '@tssuite/golden';
import { carWorldDb } from './car-world-db';
// #endregion setup
// #region read
import { Route } from '@rljson/rljson';
// #endregion read
// #endregion app

import { describe, expect, it } from 'vitest';

// #region app
// #region setup
const { db, catalogRef } = await carWorldDb();
// #endregion setup

// #region tables
// Every table of the world now lives in the Db, next to the insert history
// Db keeps for it
const tables = await db.core.tables();
const lines = tables.ls({ long: true });
await writeGolden('tables.txt', lines.join('\n'));
// #endregion tables

// #region read
// A route names the tables from the catalog down to a column. Db follows
// the layers and references and returns one cell per car.
const route = Route.fromFlat(`catalogs@${catalogRef}/carBrands/brands/model`);
const { cell } = await db.get(route, {});
const models = `Models: ${cell.map((c) => c.value).join(', ')}`;
await writeGolden('models.txt', models);
// #endregion read
// #endregion app

describe('Import tutorial', () => {
  it('imports every table of the world', async () => {
    expect(await db.core.hasTable('catalogs')).toBe(true);
    expect(await db.core.hasTable('carPrices')).toBe(true);
    expect(await db.core.hasTable('cadScenes')).toBe(true);
  });

  it('reads one model per car', () => {
    expect(cell).toHaveLength(5);
  });

  it('lists the tables', () => {
    expect(lines.some((line) => line.startsWith('catalogs'))).toBe(true);
    expect(models).toContain('Amita');
  });
});
