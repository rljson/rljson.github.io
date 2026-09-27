// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

// Snippets for src/content/docs/guides/data_types/slices.mdx
//
// The region "app" is the sample application of the tutorial. It runs when
// vitest imports this file. The tests below check what it has built.

// #region app
// #region catalog-2025
import { hip } from '@rljson/hash';
import type { SliceIds } from '@rljson/rljson';
// #endregion catalog-2025
// #region derive
import { ref } from '@rljson/rljson';
// #endregion derive
// #region tables
import type { Rljson, SliceIdsTable } from '@rljson/rljson';
// #endregion tables
// #region validate
import { BaseValidator, Validate } from '@rljson/rljson';
// #endregion validate
// #endregion app

import { writeGolden } from '@tssuite/golden';
import { describe, expect, it } from 'vitest';

// #region app
// #region catalog-2025
// The catalog of 2025 lists four cars by their slice ids
const catalog2025 = hip<SliceIds>({
  add: ['taycan', 'macan', 'ex30', 'xc40'],
});
// #endregion catalog-2025

// #region derive
// The catalog of 2026: the EX90 is new, the Macan is gone
const catalog2026 = hip<SliceIds>({
  base: ref(catalog2025),
  add: ['ex90'],
  remove: ['macan'],
});
// #endregion derive

// #region tables
// One table holds the base catalog and the catalogs derived from it
const catalogs = hip<SliceIdsTable>({
  _type: 'sliceIds',
  _data: [catalog2025, catalog2026],
});

// The key "catalogs" is the name other tables use to refer to the table
const carCatalog: Rljson = { catalogs };
// #endregion tables

// #region validate
// BaseValidator checks the hashes and the structure of the table
const validate = new Validate();
validate.addValidator(new BaseValidator());

const errors = await validate.run(carCatalog);
if (Object.keys(errors).length > 0) {
  throw new Error(JSON.stringify(errors, null, 2));
}
// #endregion validate

// #endregion app

describe('Slices tutorial', () => {
  it('derives the catalog of 2026 from 2025', async () => {
    await writeGolden('catalogs.json', catalogs);

    expect(catalog2025.add).toHaveLength(4);
    expect(catalog2026.base).toBe(ref(catalog2025));
    expect(catalog2026.add).toEqual(['ex90']);
    expect(catalog2026.remove).toEqual(['macan']);
  });

  it('validates the car catalog', () => {
    expect(errors).toEqual({});
  });
});
