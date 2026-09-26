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
// The components of the color layer
type Color = { name: string };

// Equal colors have equal hashes, so each color is stored once
const colors = hip<ComponentsTable<Color>>({
  _type: 'components',
  _data: [{ name: 'white' }, { name: 'black' }, { name: 'silver' }],
});

/** Returns the reference to a row: the hash that hip wrote into it */
const ref = (row: object): Ref => (row as { _hash: Ref })._hash;

const [white, black, silver] = colors._data;
// #endregion colors

// #region slice-ids
// The cars of 2025: the slice ids of the layer
const cars2025 = hip<SliceIds>({ add: ['taycan', 'macan', 'ex30'] });
// #endregion slice-ids

// #region layer
// Assigns a color to each car of 2025
const colors2025 = hip<Layer>({
  id: 'colors2025',
  sliceIdsTable: 'cars',
  sliceIdsTableRow: ref(cars2025),
  componentsTable: 'colors',
  add: { taycan: ref(white), macan: ref(black), ex30: ref(white) },
});
// #endregion layer

// #region variants
// The cars of 2026: the EX90 is new, the Macan is gone
const cars2026 = hip<SliceIds>({
  base: ref(cars2025),
  add: ['ex90'],
  remove: ['macan'],
});

// Stores only the difference to the colors of 2025
const colors2026 = hip<Layer>({
  id: 'colors2026',
  base: ref(colors2025),
  sliceIdsTable: 'cars',
  sliceIdsTableRow: ref(cars2026),
  componentsTable: 'colors',
  add: { ex90: ref(silver) },
  remove: { macan: ref(black) },
});
// #endregion variants

// #region tables
// The layers refer to these tables by their keys in the Rljson object
const cars = hip<SliceIdsTable>({
  _type: 'sliceIds',
  _data: [cars2025, cars2026],
});

const colorLayers = hip<LayersTable>({
  _type: 'layers',
  _data: [colors2025, colors2026],
});

const carCatalog: Rljson = { colors, cars, colorLayers };
// #endregion tables

// #region validate
// BaseValidator also checks that every car has a color
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

/** Returns the assignments of a layer, merged with those of its base */
const assignmentsOf = (layer: Layer): Record<string, Ref> => {
  // Resolve the base first, if there is one
  const baseLayer = layer.base && rowOf(colorLayers, layer.base);
  const base = baseLayer ? assignmentsOf(baseLayer) : {};
  // The assignments of the layer win over those of the base
  const assignments = { ...base, ...layer.add };

  // Drop the assignments that the layer removes
  for (const sliceId of Object.keys(layer.remove ?? {})) {
    delete assignments[sliceId];
  }

  delete assignments._hash; // hip has hashed the add object, too
  return assignments;
};

// Print the color of each car, one line per model year
for (const layer of colorLayers._data) {
  const lines = Object.entries(assignmentsOf(layer)).map(([car, colorRef]) => {
    const { name } = rowOf(colors, colorRef);
    return `${car} ${name}`;
  });

  console.log(`${layer.id}: ${lines.join(', ')}`);
}
// #endregion resolve
// #endregion app

const output = log.mock.calls.map((args) => args.join(' ')).join('\n');
log.mockRestore();

describe('Layers tutorial', () => {
  it('stores each color once', () => {
    expect(colors._data).toHaveLength(3);
    expect(colors2025.add.taycan).toBe(colors2025.add.ex30); // both white
    expect(colors2026.add.ex90).toBe(ref(silver));
  });

  it('assigns components to slice ids', async () => {
    await writeGolden('color-layers.json', colorLayers);

    expect(Object.keys(colors2025.add)).toEqual([
      'taycan',
      'macan',
      'ex30',
      '_hash',
    ]);
    expect(colors2026.base).toBe(ref(colors2025));
  });

  it('validates the car catalog', () => {
    expect(errors).toEqual({});
  });

  it('resolves the colors of each model year', async () => {
    await writeGolden('output.txt', output);

    expect(output).toBe(
      [
        'colors2025: taycan white, macan black, ex30 white',
        'colors2026: taycan white, ex30 white, ex90 silver',
      ].join('\n'),
    );
  });

  it('detects a slice id without a component', async () => {
    // #region missing-assignment
    const forgetful = hip<Layer>({
      id: 'colors2026',
      base: ref(colors2025),
      sliceIdsTable: 'cars',
      sliceIdsTableRow: ref(cars2026),
      componentsTable: 'colors',
      add: {}, // no color for the EX90
      remove: { macan: ref(black) },
    });

    const result = await validate.run({
      ...carCatalog,
      colorLayers: hip<LayersTable>({
        _type: 'layers',
        _data: [colors2025, forgetful],
      }),
    });
    // #endregion missing-assignment

    await writeGolden('missing-assignment.json', result);
    expect(result.base.layerAssignmentsDoNotMatchSliceIds).toEqual({
      error: 'Layers have missing assignments',
      layers: [
        {
          brokenLayer: ref(forgetful),
          layersTable: 'colorLayers',
          unassignedSliceIds: ['ex90'],
        },
      ],
    });
  });
});
