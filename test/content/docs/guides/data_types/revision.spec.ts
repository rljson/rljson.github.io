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
type NutritionalValues = {
  id: string;
  energy: number;
  fat: number;
  protein: number;
  carbohydrates: number;
};

/** Returns the reference to a row: the hash that hip wrote into it */
const ref = (row: object): Ref => (row as { _hash: Ref })._hash;

const flourV1 = hip<NutritionalValues>({
  id: 'flour',
  energy: 364,
  fat: 0.98,
  protein: 10.33,
  carbohydrates: 76.31,
});

const sugarV1 = hip<NutritionalValues>({
  id: 'sugar',
  energy: 387,
  fat: 0,
  protein: 0,
  carbohydrates: 100,
});
// #endregion first-version

// #region second-version
// A lab has measured more precise values
const flourV2 = hip<NutritionalValues>({
  id: 'flour',
  energy: 364.1,
  fat: 0.981,
  protein: 10.331,
  carbohydrates: 76.311,
});

const sugarV2 = hip<NutritionalValues>({
  id: 'sugar',
  energy: 387,
  fat: 0,
  protein: 0,
  carbohydrates: 99.98,
});
// #endregion second-version

// #region revisions
const revisions = hip<RevisionsTable>({
  _type: 'revisions',
  _data: [
    {
      table: 'nutritionalValues',
      id: 'flour',
      predecessor: ref(flourV1),
      successor: ref(flourV2),
      timestamp: Date.UTC(2025, 3, 2), // April 2, 2025
    },
    {
      table: 'nutritionalValues',
      id: 'sugar',
      predecessor: ref(sugarV1),
      successor: ref(sugarV2),
      timestamp: Date.UTC(2025, 4, 12), // May 12, 2025
    },
  ],
});
// #endregion revisions

// #region tables
const nutritionalValues = hip<ComponentsTable<NutritionalValues>>({
  _type: 'components',
  _data: [flourV1, sugarV1, flourV2, sugarV2], // old and new versions
});

const bakery: Rljson = { nutritionalValues, revisions };
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
validate.addValidator(revisionsValidator);

const errors = await validate.run(bakery);
if (Object.keys(errors).length > 0) {
  throw new Error(JSON.stringify(errors, null, 2));
}
// #endregion validate

// #region history
/** Finds the row with the given hash */
const rowOf = (hash: Ref) =>
  nutritionalValues._data.find((row) => ref(row) === hash)!;

/** Lists the values a revision has changed */
const changesOf = (revision: Revision) => {
  const before = rowOf(revision.predecessor);
  const after = rowOf(revision.successor);

  return (['energy', 'fat', 'protein', 'carbohydrates'] as const)
    .filter((key) => before[key] !== after[key])
    .map((key) => `${key} ${before[key]} → ${after[key]}`);
};

for (const id of ['flour', 'sugar']) {
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
    expect(ref(flourV1)).not.toBe(ref(flourV2));
    expect(nutritionalValues._data).toHaveLength(4);
  });

  it('links predecessor and successor', async () => {
    await writeGolden('revisions.json', revisions);

    expect(revisions._data[0].predecessor).toBe(ref(flourV1));
    expect(revisions._data[0].successor).toBe(ref(flourV2));
  });

  it('validates the bakery with both validators', () => {
    expect(errors).toEqual({});
  });

  it('prints the history of each ingredient', async () => {
    await writeGolden('output.txt', output);

    expect(output).toBe(
      [
        'flour',
        '  2025-04-02: energy 364 → 364.1, fat 0.98 → 0.981, ' +
          'protein 10.33 → 10.331, carbohydrates 76.31 → 76.311',
        'sugar',
        '  2025-05-12: carbohydrates 100 → 99.98',
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

    expect(latest(ref(flourV1))).toBe(ref(flourV2));
    expect(latest(ref(flourV2))).toBe(ref(flourV2)); // already the newest
    // #endregion latest
  });

  it('detects revisions of rows that do not exist', async () => {
    // #region missing-rows
    const result = await validate.run({ revisions }); // nutritionalValues is missing
    // #endregion missing-rows

    await writeGolden('missing-rows.json', result);
    expect(result).toEqual({
      revisions: {
        hasErrors: true,
        missingRows: [
          { table: 'nutritionalValues', row: ref(flourV1) },
          { table: 'nutritionalValues', row: ref(flourV2) },
          { table: 'nutritionalValues', row: ref(sugarV1) },
          { table: 'nutritionalValues', row: ref(sugarV2) },
        ],
      },
    });
  });
});
