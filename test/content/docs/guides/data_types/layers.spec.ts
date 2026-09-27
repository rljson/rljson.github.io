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
import type { ComponentsTable } from '@rljson/rljson';
import { ref } from '@rljson/rljson';
// #endregion colors
// #region slice-ids
import type { SliceIds, SliceIdsTable } from '@rljson/rljson';
// #endregion slice-ids
// #region layer
import type { Layer } from '@rljson/rljson';
// #endregion layer
// #region layers-table
import type { LayersTable, Rljson } from '@rljson/rljson';
// #endregion layers-table
// #region validate
import { BaseValidator, Validate } from '@rljson/rljson';
// #endregion validate
// #endregion app

import { writeGolden } from '@tssuite/golden';
import { describe, expect, it } from 'vitest';

// #region app
// #region colors
// A color object describes a color
type Color = { name: string };

// The table hosting all colors
const colorsTable = hip<ComponentsTable<Color>>({
  _type: 'components',
  _data: [{ name: 'white' }, { name: 'black' }, { name: 'silver' }],
});

const [white, black, silver] = colorsTable._data;
// #endregion colors

// #region slice-ids
// The catalog: the ids of all cars
const cars = hip<SliceIds>({ add: ['taycan', 'macan', 'ex30', 'xc40'] });

// The table hosting the catalog
const carsTable = hip<SliceIdsTable>({ _type: 'sliceIds', _data: [cars] });
// #endregion slice-ids

// #region layer
// Assigns a color to each car
const carColorLayer = hip<Layer>({
  sliceIdsTable: 'carsTable',
  sliceIdsTableRow: ref(cars),
  componentsTable: 'colorsTable',
  add: {
    taycan: ref(white),
    macan: ref(black),
    ex30: ref(white),
    xc40: ref(silver),
  },
});
// #endregion layer

// #region layers-table
// The table hosting the car color layer
const carLayersTable = hip<LayersTable>({
  _type: 'layers',
  _data: [carColorLayer],
});

// Layers refer to tables by their keys in the Rljson object
const carCatalog: Rljson = { colorsTable, carsTable, carLayersTable };
// #endregion layers-table

// #region validate
// BaseValidator also checks that every car has a color
const validate = new Validate();
validate.addValidator(new BaseValidator());

const errors = await validate.run(carCatalog);
if (Object.keys(errors).length > 0) {
  throw new Error(JSON.stringify(errors, null, 2));
}
console.log('The car catalog is valid');
// #endregion validate
// #endregion app

describe('Layers tutorial', () => {
  it('stores each color once', () => {
    expect(colorsTable._data).toHaveLength(3);
    expect(carColorLayer.add.taycan).toBe(carColorLayer.add.ex30);
  });

  it('assigns a color to each car', async () => {
    await writeGolden('car-layers-table.json', carLayersTable);
    expect(Object.keys(carColorLayer.add)).toEqual([
      'taycan',
      'macan',
      'ex30',
      'xc40',
      '_hash',
    ]);
  });

  it('validates the car catalog', () => {
    expect(errors).toEqual({});
  });
});
