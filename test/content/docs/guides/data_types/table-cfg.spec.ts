// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

// Snippets for src/content/docs/guides/data_types/table-cfg.mdx
//
// The region "app" is the sample application of the tutorial. It runs when
// vitest imports this file. The tests below check what it has built.

// #region app
// #region nutritional-values-cfg
import { hip } from '@rljson/hash';
import { type TableCfg, throwOnInvalidTableCfg } from '@rljson/rljson';
// #endregion nutritional-values-cfg
// #region table-cfgs
import type { TablesCfgTable } from '@rljson/rljson';
// #endregion table-cfgs
// #region nutritional-values
import type { ComponentsTable, Ref } from '@rljson/rljson';
// #endregion nutritional-values
// #region check-rows
import { validateRljsonAgainstTableCfg } from '@rljson/rljson';
// #endregion check-rows
// #region validate
import { BaseValidator, type Rljson, Validate } from '@rljson/rljson';
// #endregion validate
// #endregion app

import { writeGolden } from '@tssuite/golden';
import { describe, expect, it, vi } from 'vitest';

// Record what the application prints
const log = vi.spyOn(console, 'log').mockImplementation(() => {});

// #region app
// #region nutritional-values-cfg
const nutritionalValuesCfg = hip<TableCfg>({
  key: 'nutritionalValues',
  type: 'components',
  columns: [
    { key: '_hash', type: 'string', titleLong: 'Hash', titleShort: 'Hash' },
    {
      key: 'energy',
      type: 'number',
      titleLong: 'Energy in kcal per 100 g',
      titleShort: 'Energy',
    },
    {
      key: 'fat',
      type: 'number',
      titleLong: 'Fat in g per 100 g',
      titleShort: 'Fat',
    },
    {
      key: 'protein',
      type: 'number',
      titleLong: 'Protein in g per 100 g',
      titleShort: 'Protein',
    },
    {
      key: 'carbohydrates',
      type: 'number',
      titleLong: 'Carbohydrates in g per 100 g',
      titleShort: 'Carbs',
    },
  ],
  isHead: false,
  isRoot: false,
  isShared: true,
});

throwOnInvalidTableCfg(nutritionalValuesCfg);
// #endregion nutritional-values-cfg

// #region ingredients-cfg
const ingredientsCfg = hip<TableCfg>({
  key: 'ingredients',
  type: 'components',
  columns: [
    { key: '_hash', type: 'string', titleLong: 'Hash', titleShort: 'Hash' },
    { key: 'id', type: 'string', titleLong: 'Ingredient', titleShort: 'Id' },
    {
      key: 'amountUnit',
      type: 'string',
      titleLong: 'Amount unit',
      titleShort: 'Unit',
    },
    {
      key: 'nutritionalValuesRef',
      type: 'string',
      titleLong: 'Nutritional values',
      titleShort: 'Nutrition',
      ref: { tableKey: 'nutritionalValues', type: 'components' },
    },
  ],
  isHead: true,
  isRoot: true,
  isShared: false,
});

throwOnInvalidTableCfg(ingredientsCfg);
// #endregion ingredients-cfg

// #region table-cfgs
const tableCfgs = hip<TablesCfgTable>({
  _type: 'tableCfgs',
  _data: [nutritionalValuesCfg, ingredientsCfg],
});
// #endregion table-cfgs

// #region nutritional-values
type NutritionalValues = {
  energy: number;
  fat: number;
  protein: number;
  carbohydrates: number;
};

/** Returns the reference to a row: the hash that hip wrote into it */
const ref = (row: object): Ref => (row as { _hash: Ref })._hash;

const nutritionalValues = hip<ComponentsTable<NutritionalValues>>({
  _type: 'components',
  _tableCfg: ref(nutritionalValuesCfg),
  _data: [
    { energy: 364, fat: 0.98, protein: 10.33, carbohydrates: 76.31 }, // flour
    { energy: 387, fat: 0, protein: 0, carbohydrates: 100 }, // sugar
  ],
});

const [flourValues, sugarValues] = nutritionalValues._data;
// #endregion nutritional-values

// #region check-rows
type Row = Record<string, string>;

// Rows delivered by a supplier, e.g. read from a JSON file
const delivery: Row[] = [
  { id: 'flour', amountUnit: 'g', nutritionalValuesRef: ref(flourValues) },
  { id: 'sugar', amountUnit: 'g', nutritionalValuesRef: ref(sugarValues) },
  {
    id: 'powderedSugar',
    amountUnit: 'g',
    nutritionalValuesRef: ref(sugarValues),
  },
  { id: 'butter', unit: 'g' },
];

const accepted: Row[] = [];
for (const row of delivery) {
  const problems = validateRljsonAgainstTableCfg([row], ingredientsCfg);

  if (problems.length > 0) {
    console.log(`✗ ${row.id}: ${problems.join(' ')}`);
  } else {
    console.log(`✓ ${row.id}`);
    accepted.push(row);
  }
}
// #endregion check-rows

// #region ingredients
const ingredients = hip<ComponentsTable<Row>>({
  _type: 'components',
  _tableCfg: ref(ingredientsCfg),
  _data: accepted,
});
// #endregion ingredients

// #region validate
const catalog: Rljson = { tableCfgs, nutritionalValues, ingredients };

const validate = new Validate();
validate.addValidator(new BaseValidator());

const errors = await validate.run(catalog);
if (Object.keys(errors).length > 0) {
  throw new Error(JSON.stringify(errors, null, 2));
}
// #endregion validate
// #endregion app

const output = log.mock.calls.map((args) => args.join(' ')).join('\n');
log.mockRestore();

describe('TableCfg tutorial', () => {
  it('describes the tables', async () => {
    await writeGolden('table-cfgs.json', tableCfgs);

    expect(() =>
      throwOnInvalidTableCfg({ ...ingredientsCfg, columns: [] }),
    ).toThrow('must have at least a _hash and a second column');
  });

  it('links each table to its config', async () => {
    await writeGolden('ingredients.json', ingredients);

    expect(nutritionalValues._tableCfg).toBe(ref(nutritionalValuesCfg));
    expect(ingredients._tableCfg).toBe(ref(ingredientsCfg));
  });

  it('checks rows before they are added', async () => {
    await writeGolden('output.txt', output);

    expect(output).toBe(
      [
        '✓ flour',
        '✓ sugar',
        '✓ powderedSugar',
        '✗ butter: Column "unit" in row 0 of table "ingredients" does not exist.',
      ].join('\n'),
    );
    expect(accepted.map((row) => row.id)).toEqual([
      'flour',
      'sugar',
      'powderedSugar',
    ]);
  });

  it('validates the catalog', () => {
    expect(errors).toEqual({});
  });

  it('detects a value of the wrong type', async () => {
    // #region wrong-type
    const fromCsv = hip<ComponentsTable<Record<string, string | number>>>({
      _type: 'components',
      _tableCfg: ref(nutritionalValuesCfg),
      _data: [
        { energy: '364', fat: 0.98, protein: 10.33, carbohydrates: 76.31 },
      ],
    });

    const result = await validate.run({
      ...catalog,
      nutritionalValues: fromCsv,
    });
    // #endregion wrong-type

    await writeGolden('wrong-type.json', result);
    expect(result.base.dataDoesNotMatchColumnConfig).toEqual({
      error: 'Table values have wrong types',
      brokenValues: [
        {
          table: 'nutritionalValues',
          row: ref(fromCsv._data[0]),
          column: 'energy',
          tableCfg: ref(nutritionalValuesCfg),
        },
      ],
    });
  });

  it('detects a broken reference', async () => {
    // #region broken-ref
    const honey = hip<ComponentsTable<Row>>({
      _type: 'components',
      _tableCfg: ref(ingredientsCfg),
      _data: [{ id: 'honey', amountUnit: 'g', nutritionalValuesRef: 'noHash' }],
    });

    const result = await validate.run({ ...catalog, ingredients: honey });
    // #endregion broken-ref

    await writeGolden('broken-ref.json', result);
    expect(result.base.refsNotFound).toEqual({
      error: 'Broken references',
      missingRefs: [
        {
          error: 'Table "nutritionalValues" has no item with hash "noHash"',
          sourceTable: 'ingredients',
          sourceItemHash: ref(honey._data[0]),
          sourceKey: 'nutritionalValuesRef',
          targetTable: 'nutritionalValues',
          targetItemHash: 'noHash',
        },
      ],
    });
  });

  it('requires an id column in head and root tables', async () => {
    const withoutId = hip<TableCfg>({
      ...ingredientsCfg,
      _hash: '',
      columns: ingredientsCfg.columns.filter((column) => column.key !== 'id'),
    });

    const result = new BaseValidator().validateSync({
      tableCfgs: hip<TablesCfgTable>({
        _type: 'tableCfgs',
        _data: [withoutId],
      }),
      ingredients: hip<ComponentsTable<Row>>({
        _type: 'components',
        _tableCfg: ref(withoutId),
        _data: [{ amountUnit: 'g' }],
      }),
    });

    expect(result.rootOrHeadTableHasNoIdColumn).toBeDefined();
  });

  it('rejects inconsistent head, root and shared flags', () => {
    const neither = hip<TableCfg>({
      ...nutritionalValuesCfg,
      _hash: '',
      isShared: false,
    });

    const result = new BaseValidator().validateSync({
      tableCfgs: hip<TablesCfgTable>({ _type: 'tableCfgs', _data: [neither] }),
      nutritionalValues: hip<ComponentsTable<NutritionalValues>>({
        _type: 'components',
        _tableCfg: ref(neither),
        _data: [
          { energy: 364, fat: 0.98, protein: 10.33, carbohydrates: 76.31 },
        ],
      }),
    });

    expect(result.tableCfgHasRootHeadSharedError).toEqual({
      error: 'Table configs have inconsistent root/head/shared settings',
      tables: [
        {
          error: 'Tables must be either root, root+head or shared',
          table: 'nutritionalValues',
          tableCfg: ref(neither),
        },
      ],
    });
  });
});
