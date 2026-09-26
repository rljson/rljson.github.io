// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

// Snippets for src/content/docs/guides/data_types/layers.mdx
//
// The region "app" is the sample application of the tutorial. It runs when
// vitest imports this file. The tests below check what it has built.

// #region app
// #region colors
import { hip } from '@rljson/hash';
import type { ComponentsTable, Ref } from '@rljson/rljson';
// #endregion colors
// #region slice-ids
import type { SliceIds } from '@rljson/rljson';
// #endregion slice-ids
// #region layer
import type { Layer } from '@rljson/rljson';
// #endregion layer
// #region tables
import type { LayersTable, Rljson, SliceIdsTable } from '@rljson/rljson';
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
// #region colors
type Color = { name: string };

const colors = hip<ComponentsTable<Color>>({
  _type: 'components',
  _data: [{ name: 'white' }, { name: 'black' }, { name: 'silver' }],
});

/** Returns the reference to a row: the hash that hip wrote into it */
const ref = (row: object): Ref => (row as { _hash: Ref })._hash;

const [white, black, silver] = colors._data;
// #endregion colors

// #region slice-ids
const standardParts = hip<SliceIds>({ add: ['body', 'roof', 'wheels'] });
// #endregion slice-ids

// #region layer
const standard = hip<Layer>({
  id: 'standard',
  sliceIdsTable: 'carParts',
  sliceIdsTableRow: ref(standardParts),
  componentsTable: 'colors',
  add: { body: ref(white), roof: ref(black), wheels: ref(silver) },
});
// #endregion layer

// #region variants
// A sport scheme: the standard scheme plus stripes
const sportParts = hip<SliceIds>({
  base: ref(standardParts),
  add: ['stripes'],
});

const sport = hip<Layer>({
  id: 'sport',
  base: ref(standard),
  sliceIdsTable: 'carParts',
  sliceIdsTableRow: ref(sportParts),
  componentsTable: 'colors',
  add: { stripes: ref(black) },
});

// A convertible: a soft top instead of the roof
const convertibleParts = hip<SliceIds>({
  base: ref(standardParts),
  add: ['softTop'],
  remove: ['roof'],
});

const convertible = hip<Layer>({
  id: 'convertible',
  base: ref(standard),
  sliceIdsTable: 'carParts',
  sliceIdsTableRow: ref(convertibleParts),
  componentsTable: 'colors',
  add: { softTop: ref(black) },
  remove: { roof: ref(black) },
});
// #endregion variants

// #region tables
const carParts = hip<SliceIdsTable>({
  _type: 'sliceIds',
  _data: [standardParts, sportParts, convertibleParts],
});

const paintSchemes = hip<LayersTable>({
  _type: 'layers',
  _data: [standard, sport, convertible],
});

const paintShop: Rljson = { colors, carParts, paintSchemes };
// #endregion tables

// #region validate
const validate = new Validate();
validate.addValidator(new BaseValidator());

const errors = await validate.run(paintShop);
if (Object.keys(errors).length > 0) {
  throw new Error(JSON.stringify(errors, null, 2));
}
// #endregion validate

// #region resolve
/** Follows a reference: finds the row with the given hash */
const rowOf = <T extends object>(table: { _data: T[] }, hash: Ref): T =>
  table._data.find((row) => ref(row) === hash)!;

/** Returns the assignments of a layer, merged with those of its base */
const assignmentsOf = (layer: Layer): Record<string, Ref> => {
  const baseLayer = layer.base && rowOf(paintSchemes, layer.base);
  const base = baseLayer ? assignmentsOf(baseLayer) : {};
  const assignments = { ...base, ...layer.add };

  for (const sliceId of Object.keys(layer.remove ?? {})) {
    delete assignments[sliceId];
  }

  delete assignments._hash; // hip has hashed the add object, too
  return assignments;
};

for (const scheme of paintSchemes._data) {
  const lines = Object.entries(assignmentsOf(scheme)).map(
    ([part, colorRef]) => {
      const { name } = rowOf(colors, colorRef);
      return `${name} ${part}`;
    },
  );

  console.log(`${scheme.id}: ${lines.join(', ')}`);
}
// #endregion resolve
// #endregion app

const output = log.mock.calls.map((args) => args.join(' ')).join('\n');
log.mockRestore();

describe('Layers tutorial', () => {
  it('stores each color once', () => {
    expect(colors._data).toHaveLength(3);
    expect(sport.add.stripes).toBe(standard.add.roof); // both black
    expect(convertible.add.softTop).toBe(standard.add.roof); // both black
  });

  it('derives slice ids from a base', async () => {
    await writeGolden('car-parts.json', carParts);

    expect(sportParts.base).toBe(ref(standardParts));
    expect(convertibleParts.remove).toEqual(['roof']);
  });

  it('assigns components to slice ids', async () => {
    await writeGolden('paint-schemes.json', paintSchemes);

    expect(Object.keys(standard.add)).toEqual([
      'body',
      'roof',
      'wheels',
      '_hash',
    ]);
  });

  it('validates the paint shop', () => {
    expect(errors).toEqual({});
  });

  it('resolves the colors of each paint scheme', async () => {
    await writeGolden('output.txt', output);

    expect(output).toBe(
      [
        'standard: white body, black roof, silver wheels',
        'sport: white body, black roof, silver wheels, black stripes',
        'convertible: white body, silver wheels, black softTop',
      ].join('\n'),
    );
  });

  it('detects a slice id without a component', async () => {
    // #region missing-assignment
    const forgetful = hip<Layer>({
      id: 'sport',
      base: ref(standard),
      sliceIdsTable: 'carParts',
      sliceIdsTableRow: ref(sportParts),
      componentsTable: 'colors',
      add: {}, // no color for the stripes
    });

    const result = await validate.run({
      ...paintShop,
      paintSchemes: hip<LayersTable>({
        _type: 'layers',
        _data: [standard, forgetful],
      }),
    });
    // #endregion missing-assignment

    await writeGolden('missing-assignment.json', result);
    expect(result.base.layerAssignmentsDoNotMatchSliceIds).toEqual({
      error: 'Layers have missing assignments',
      layers: [
        {
          brokenLayer: ref(forgetful),
          layersTable: 'paintSchemes',
          unassignedSliceIds: ['stripes'],
        },
      ],
    });
  });
});
