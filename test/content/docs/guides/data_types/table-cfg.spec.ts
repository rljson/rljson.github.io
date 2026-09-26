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
// #region manufacturers-cfg
import { hip } from '@rljson/hash';
import { type TableCfg, throwOnInvalidTableCfg } from '@rljson/rljson';
// #endregion manufacturers-cfg
// #region table-cfgs
import type { TablesCfgTable } from '@rljson/rljson';
// #endregion table-cfgs
// #region manufacturers
import type { ComponentsTable, Ref } from '@rljson/rljson';
// #endregion manufacturers
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
// #region manufacturers-cfg
// Describes the table "manufacturers" and its columns
const manufacturersCfg = hip<TableCfg>({
  key: 'manufacturers',
  type: 'components',
  columns: [
    { key: '_hash', type: 'string', titleLong: 'Hash', titleShort: 'Hash' },
    {
      key: 'name',
      type: 'string',
      titleLong: 'Manufacturer',
      titleShort: 'Name',
    },
    {
      key: 'country',
      type: 'string',
      titleLong: 'Country',
      titleShort: 'Country',
    },
    {
      key: 'founded',
      type: 'number',
      titleLong: 'Year of foundation',
      titleShort: 'Founded',
    },
  ],
  isHead: false,
  isRoot: false,
  isShared: true,
});

// Fail early if the configuration itself is invalid
throwOnInvalidTableCfg(manufacturersCfg);
// #endregion manufacturers-cfg

// #region cars-cfg
// Describes the table "cars"; manufacturersRef refers to a manufacturer
const carsCfg = hip<TableCfg>({
  key: 'cars',
  type: 'components',
  columns: [
    { key: '_hash', type: 'string', titleLong: 'Hash', titleShort: 'Hash' },
    { key: 'id', type: 'string', titleLong: 'Model', titleShort: 'Id' },
    {
      key: 'bodyStyle',
      type: 'string',
      titleLong: 'Body style',
      titleShort: 'Body',
    },
    {
      key: 'manufacturersRef',
      type: 'string',
      titleLong: 'Manufacturer',
      titleShort: 'Maker',
      ref: { tableKey: 'manufacturers', type: 'components' },
    },
  ],
  isHead: true,
  isRoot: true,
  isShared: false,
});

throwOnInvalidTableCfg(carsCfg);
// #endregion cars-cfg

// #region table-cfgs
// All configurations live in the table "tableCfgs"
const tableCfgs = hip<TablesCfgTable>({
  _type: 'tableCfgs',
  _data: [manufacturersCfg, carsCfg],
});
// #endregion table-cfgs

// #region manufacturers
type Manufacturer = { name: string; country: string; founded: number };

/** Returns the reference to a row: the hash that hip wrote into it */
const ref = (row: object): Ref => (row as { _hash: Ref })._hash;

// _tableCfg links the table to its configuration
const manufacturers = hip<ComponentsTable<Manufacturer>>({
  _type: 'components',
  _tableCfg: ref(manufacturersCfg),
  _data: [
    { name: 'Porsche', country: 'Germany', founded: 1931 },
    { name: 'Volvo', country: 'Sweden', founded: 1927 },
  ],
});

const [porsche, volvo] = manufacturers._data;
// #endregion manufacturers

// #region check-rows
type Row = Record<string, string>;

// Rows delivered by an importer, e.g. read from a JSON file
const delivery: Row[] = [
  { id: 'taycan', bodyStyle: 'sedan', manufacturersRef: ref(porsche) },
  { id: 'ex30', bodyStyle: 'suv', manufacturersRef: ref(volvo) },
  { id: 'macan', bodyStyle: 'suv', manufacturersRef: ref(porsche) },
  { id: 'ex90', body: 'suv' },
];

// Check each row on its own and keep only the valid ones
const accepted: Row[] = [];
for (const row of delivery) {
  const problems = validateRljsonAgainstTableCfg([row], carsCfg);

  if (problems.length > 0) {
    console.log(`✗ ${row.id}: ${problems.join(' ')}`);
  } else {
    console.log(`✓ ${row.id}`);
    accepted.push(row);
  }
}
// #endregion check-rows

// #region cars
// The cars table gets only the accepted rows
const cars = hip<ComponentsTable<Row>>({
  _type: 'components',
  _tableCfg: ref(carsCfg),
  _data: accepted,
});
// #endregion cars

// #region validate
const catalog: Rljson = { tableCfgs, manufacturers, cars };

// BaseValidator checks the tables against their configurations
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

    expect(() => throwOnInvalidTableCfg({ ...carsCfg, columns: [] })).toThrow(
      'must have at least a _hash and a second column',
    );
  });

  it('links each table to its config', async () => {
    await writeGolden('cars.json', cars);

    expect(manufacturers._tableCfg).toBe(ref(manufacturersCfg));
    expect(cars._tableCfg).toBe(ref(carsCfg));
  });

  it('checks rows before they are added', async () => {
    await writeGolden('output.txt', output);

    expect(output).toBe(
      [
        '✓ taycan',
        '✓ ex30',
        '✓ macan',
        '✗ ex90: Column "body" in row 0 of table "cars" does not exist.',
      ].join('\n'),
    );
    expect(accepted.map((row) => row.id)).toEqual(['taycan', 'ex30', 'macan']);
  });

  it('validates the catalog', () => {
    expect(errors).toEqual({});
  });

  it('detects a value of the wrong type', async () => {
    // #region wrong-type
    const fromCsv = hip<ComponentsTable<Record<string, string | number>>>({
      _type: 'components',
      _tableCfg: ref(manufacturersCfg),
      _data: [{ name: 'Porsche', country: 'Germany', founded: '1931' }],
    });

    const result = await validate.run({ ...catalog, manufacturers: fromCsv });
    // #endregion wrong-type

    await writeGolden('wrong-type.json', result);
    expect(result.base.dataDoesNotMatchColumnConfig).toEqual({
      error: 'Table values have wrong types',
      brokenValues: [
        {
          table: 'manufacturers',
          row: ref(fromCsv._data[0]),
          column: 'founded',
          tableCfg: ref(manufacturersCfg),
        },
      ],
    });
  });

  it('detects a broken reference', async () => {
    // #region broken-ref
    const orphan = hip<ComponentsTable<Row>>({
      _type: 'components',
      _tableCfg: ref(carsCfg),
      _data: [
        { id: 'golf', bodyStyle: 'hatchback', manufacturersRef: 'noHash' },
      ],
    });

    const result = await validate.run({ ...catalog, cars: orphan });
    // #endregion broken-ref

    await writeGolden('broken-ref.json', result);
    expect(result.base.refsNotFound).toEqual({
      error: 'Broken references',
      missingRefs: [
        {
          error: 'Table "manufacturers" has no item with hash "noHash"',
          sourceTable: 'cars',
          sourceItemHash: ref(orphan._data[0]),
          sourceKey: 'manufacturersRef',
          targetTable: 'manufacturers',
          targetItemHash: 'noHash',
        },
      ],
    });
  });

  it('requires an id column in head and root tables', async () => {
    const withoutId = hip<TableCfg>({
      ...carsCfg,
      _hash: '',
      columns: carsCfg.columns.filter((column) => column.key !== 'id'),
    });

    const result = new BaseValidator().validateSync({
      tableCfgs: hip<TablesCfgTable>({
        _type: 'tableCfgs',
        _data: [withoutId],
      }),
      cars: hip<ComponentsTable<Row>>({
        _type: 'components',
        _tableCfg: ref(withoutId),
        _data: [{ bodyStyle: 'suv' }],
      }),
    });

    expect(result.rootOrHeadTableHasNoIdColumn).toBeDefined();
  });

  it('rejects inconsistent head, root and shared flags', () => {
    const neither = hip<TableCfg>({
      ...manufacturersCfg,
      _hash: '',
      isShared: false,
    });

    const result = new BaseValidator().validateSync({
      tableCfgs: hip<TablesCfgTable>({ _type: 'tableCfgs', _data: [neither] }),
      manufacturers: hip<ComponentsTable<Manufacturer>>({
        _type: 'components',
        _tableCfg: ref(neither),
        _data: [{ name: 'Porsche', country: 'Germany', founded: 1931 }],
      }),
    });

    expect(result.tableCfgHasRootHeadSharedError).toEqual({
      error: 'Table configs have inconsistent root/head/shared settings',
      tables: [
        {
          error: 'Tables must be either root, root+head or shared',
          table: 'manufacturers',
          tableCfg: ref(neither),
        },
      ],
    });
  });
});
