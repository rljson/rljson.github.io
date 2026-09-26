// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

// Snippets for src/content/docs/guides/data_types/revision.mdx
//
// The region "app" is the sample application of the tutorial. It runs when
// vitest imports this file. The tests below check what it has built.

// #region app
// #region first-version
import { hip } from '@rljson/hash';
import type { Ref } from '@rljson/rljson';
// #endregion first-version
// #region revisions
import type { RevisionsTable } from '@rljson/rljson';
// #endregion revisions
// #region tables
import type { ComponentsTable, Rljson } from '@rljson/rljson';
// #endregion tables
// #region validator
import type { Errors, Validator } from '@rljson/rljson';
// #endregion validator
// #region validate
import { BaseValidator, Validate } from '@rljson/rljson';
// #endregion validate
// #region history
import type { Revision } from '@rljson/rljson';
// #endregion history
// #endregion app

import { writeGolden } from '@tssuite/golden';
import { describe, expect, it, vi } from 'vitest';

// Record what the application prints
const log = vi.spyOn(console, 'log').mockImplementation(() => {});

// #region app
// #region first-version
type Car = {
  id: string;
  power: number; // kW
  range: number; // km
  weight: number; // kg
};

/** Returns the reference to a row: the hash that hip wrote into it */
const ref = (row: object): Ref => (row as { _hash: Ref })._hash;

// The first version of each car
const taycanV1 = hip<Car>({
  id: 'taycan',
  power: 300,
  range: 503,
  weight: 2140,
});

const ex30V1 = hip<Car>({
  id: 'ex30',
  power: 200,
  range: 476,
  weight: 1850,
});
// #endregion first-version

// #region second-version
// The manufacturers have published new values after a software update
const taycanV2 = hip<Car>({
  id: 'taycan',
  power: 320,
  range: 520,
  weight: 2140,
});

const ex30V2 = hip<Car>({
  id: 'ex30',
  power: 200,
  range: 480,
  weight: 1850,
});
// #endregion second-version

// #region revisions
// Each revision links the old version of a car to the new one
const revisions = hip<RevisionsTable>({
  _type: 'revisions',
  _data: [
    {
      table: 'cars',
      id: 'taycan',
      predecessor: ref(taycanV1),
      successor: ref(taycanV2),
      timestamp: Date.UTC(2025, 3, 2), // April 2, 2025
    },
    {
      table: 'cars',
      id: 'ex30',
      predecessor: ref(ex30V1),
      successor: ref(ex30V2),
      timestamp: Date.UTC(2025, 4, 12), // May 12, 2025
    },
  ],
});
// #endregion revisions

// #region tables
// The table keeps both versions: the revisions point to them
const cars = hip<ComponentsTable<Car>>({
  _type: 'components',
  _data: [taycanV1, ex30V1, taycanV2, ex30V2], // old and new versions
});

const garage: Rljson = { cars, revisions };
// #endregion tables

// #region validator
/** Checks that the rows linked by each revision exist */
const revisionsValidator: Validator = {
  name: 'revisions',
  validate: async (rljson): Promise<Errors> => {
    const table = rljson.revisions as RevisionsTable | undefined;

    const missingRows = (table?._data ?? []).flatMap((revision) =>
      [revision.predecessor, revision.successor]
        .filter(
          (hash) =>
            !rljson[revision.table]?._data.some((row) => ref(row) === hash),
        )
        .map((hash) => ({ table: revision.table, row: hash })),
    );

    return missingRows.length > 0
      ? { hasErrors: true, missingRows }
      : { hasErrors: false };
  },
};
// #endregion validator

// #region validate
const validate = new Validate();
validate.addValidator(new BaseValidator());
// Also check the rows that the revisions link
validate.addValidator(revisionsValidator);

const errors = await validate.run(garage);
if (Object.keys(errors).length > 0) {
  throw new Error(JSON.stringify(errors, null, 2));
}
// #endregion validate

// #region history
/** Finds the row with the given hash */
const rowOf = (hash: Ref) => cars._data.find((row) => ref(row) === hash)!;

/** Lists the values a revision has changed */
const changesOf = (revision: Revision) => {
  const before = rowOf(revision.predecessor);
  const after = rowOf(revision.successor);

  return (['power', 'range', 'weight'] as const)
    .filter((key) => before[key] !== after[key])
    .map((key) => `${key} ${before[key]} → ${after[key]}`);
};

// Print the history of each car, oldest change first
for (const id of ['taycan', 'ex30']) {
  console.log(id);

  const history = revisions._data
    .filter((revision) => revision.id === id)
    .sort((a, b) => a.timestamp - b.timestamp);

  for (const revision of history) {
    const date = new Date(revision.timestamp).toISOString().slice(0, 10);
    console.log(`  ${date}: ${changesOf(revision).join(', ')}`);
  }
}
// #endregion history
// #endregion app

const output = log.mock.calls.map((args) => args.join(' ')).join('\n');
log.mockRestore();

describe('Revision tutorial', () => {
  it('keeps each version as a row of its own', () => {
    expect(ref(taycanV1)).not.toBe(ref(taycanV2));
    expect(cars._data).toHaveLength(4);
  });

  it('links predecessor and successor', async () => {
    await writeGolden('revisions.json', revisions);

    expect(revisions._data[0].predecessor).toBe(ref(taycanV1));
    expect(revisions._data[0].successor).toBe(ref(taycanV2));
  });

  it('validates the garage with both validators', () => {
    expect(errors).toEqual({});
  });

  it('prints the history of each car', async () => {
    await writeGolden('output.txt', output);

    expect(output).toBe(
      [
        'taycan',
        '  2025-04-02: power 300 → 320, range 503 → 520',
        'ex30',
        '  2025-05-12: range 476 → 480',
      ].join('\n'),
    );
  });

  it('finds the newest version', () => {
    // #region latest
    /** Follows the revisions of a row to its newest version */
    const latest = (hash: Ref): Ref => {
      const next = revisions._data.find((r) => r.predecessor === hash);
      return next ? latest(next.successor) : hash;
    };

    expect(latest(ref(taycanV1))).toBe(ref(taycanV2));
    expect(latest(ref(taycanV2))).toBe(ref(taycanV2)); // already the newest
    // #endregion latest
  });

  it('detects revisions of rows that do not exist', async () => {
    // #region missing-rows
    const result = await validate.run({ revisions }); // cars is missing
    // #endregion missing-rows

    await writeGolden('missing-rows.json', result);
    expect(result).toEqual({
      revisions: {
        hasErrors: true,
        missingRows: [
          { table: 'cars', row: ref(taycanV1) },
          { table: 'cars', row: ref(taycanV2) },
          { table: 'cars', row: ref(ex30V1) },
          { table: 'cars', row: ref(ex30V2) },
        ],
      },
    });
  });
});
