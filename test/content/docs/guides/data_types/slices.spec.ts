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
// #region slice-ids
import { hip } from '@rljson/hash';
import type { Ref, SliceIds } from '@rljson/rljson';
// #endregion slice-ids
// #region tables
import type { Rljson, SliceIdsTable } from '@rljson/rljson';
// #endregion tables
// #region validate
import { BaseValidator, Validate } from '@rljson/rljson';
// #endregion validate
// #endregion app

import { writeGolden } from '@tssuite/golden';
import { describe, expect, it, vi } from 'vitest';

// Record what the application prints
const log = vi.spyOn(console, 'log').mockImplementation(() => {});

// #region app
// #region slice-ids
// The cars of 2025: the slice ids of the catalog
const cars2025 = hip<SliceIds>({ add: ['taycan', 'macan', 'ex30'] });

/** Returns the reference to a row: the hash that hip wrote into it */
const ref = (row: object): Ref => (row as { _hash: Ref })._hash;
// #endregion slice-ids

// #region derive
// The cars of 2026: the EX90 is new, the Macan is gone
const cars2026 = hip<SliceIds>({
  base: ref(cars2025),
  add: ['ex90'],
  remove: ['macan'],
});
// #endregion derive

// #region tables
// One table holds the base row and the rows derived from it
const cars = hip<SliceIdsTable>({
  _type: 'sliceIds',
  _data: [cars2025, cars2026],
});

// The key "cars" is the name other tables use to refer to the table
const carCatalog: Rljson = { cars };
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

// #region resolve
/** Follows a reference: finds the row with the given hash */
const rowOf = <T extends object>(table: { _data: T[] }, hash: Ref): T =>
  table._data.find((row) => ref(row) === hash)!;

/** Returns the slice ids of a row, merged with those of its base */
const sliceIdsOf = (row: SliceIds): string[] => {
  // Start with the slice ids of the base, if there is one
  const base = row.base ? sliceIdsOf(rowOf(cars, row.base)) : [];
  const removed = row.remove ?? [];
  // Add the own slice ids and drop the removed ones
  return [...base, ...row.add].filter((id) => !removed.includes(id));
};

// Print the cars of each model year
for (const row of cars._data) {
  console.log(sliceIdsOf(row).join(', '));
}
// #endregion resolve
// #endregion app

const output = log.mock.calls.map((args) => args.join(' ')).join('\n');
log.mockRestore();

describe('Slices tutorial', () => {
  it('derives slice ids from a base', async () => {
    await writeGolden('cars.json', cars);

    expect(cars2026.base).toBe(ref(cars2025));
    expect(cars2026.add).toEqual(['ex90']);
    expect(cars2026.remove).toEqual(['macan']);
  });

  it('validates the car catalog', () => {
    expect(errors).toEqual({});
  });

  it('resolves the slice ids of each model year', async () => {
    await writeGolden('output.txt', output);

    expect(output).toBe(
      ['taycan, macan, ex30', 'taycan, ex30, ex90'].join('\n'),
    );
  });
});
