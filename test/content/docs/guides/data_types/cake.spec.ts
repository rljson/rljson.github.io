// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

// Snippets for src/content/docs/guides/data_types/cake.mdx
//
// The region "app" is the sample application of the tutorial. It runs when
// vitest imports this file. The tests below check what it has built.

// #region app
// #region layers
import { hip } from '@rljson/hash';
import type {
  ComponentsTable,
  Layer,
  LayersTable,
  SliceIds,
  SliceIdsTable,
} from '@rljson/rljson';
import { ref } from '@rljson/rljson';
// #endregion layers
// #region cake
import type { Cake, CakesTable, Rljson } from '@rljson/rljson';
// #endregion cake
// #region validate
import { BaseValidator, Validate } from '@rljson/rljson';
// #endregion validate
// #endregion app

import { writeGolden } from '@tssuite/golden';
import { describe, expect, it } from 'vitest';

// #region app
// #region layers
// The interfaces of the three layers
type Color = { name: string };
type Brand = { name: string };
type Price = { amount: number; currency: 'EUR' };

// The tables hosting the colors, brands and prices
const colorsTable = hip<ComponentsTable<Color>>({
  _type: 'components',
  _data: [{ name: 'white' }, { name: 'black' }, { name: 'silver' }],
});

const brandsTable = hip<ComponentsTable<Brand>>({
  _type: 'components',
  _data: [{ name: 'Quinis' }, { name: 'Corex' }],
});

const pricesTable = hip<ComponentsTable<Price>>({
  _type: 'components',
  _data: [
    { amount: 101000, currency: 'EUR' },
    { amount: 84000, currency: 'EUR' },
    { amount: 36000, currency: 'EUR' },
    { amount: 48000, currency: 'EUR' },
  ],
});

// The catalog: the ids of all cars, shared by all layers
const cars = hip<SliceIds>({ add: ['vimuna', 'ivoel', 'rivel', 'amar'] });
const carsTable = hip<SliceIdsTable>({ _type: 'sliceIds', _data: [cars] });

const [white, black, silver] = colorsTable._data;
const [quinis, corex] = brandsTable._data;
const [vimunaPrice, ivoelPrice, rivelPrice, amarPrice] = pricesTable._data;

// One layer per aspect of the cars
const colorLayer = hip<Layer>({
  sliceIdsTable: 'carsTable',
  sliceIdsTableRow: ref(cars),
  componentsTable: 'colorsTable',
  add: {
    vimuna: ref(white),
    ivoel: ref(black),
    rivel: ref(white),
    amar: ref(silver),
  },
});

const brandLayer = hip<Layer>({
  sliceIdsTable: 'carsTable',
  sliceIdsTableRow: ref(cars),
  componentsTable: 'brandsTable',
  add: {
    vimuna: ref(quinis),
    ivoel: ref(quinis),
    rivel: ref(corex),
    amar: ref(corex),
  },
});

const priceLayer = hip<Layer>({
  sliceIdsTable: 'carsTable',
  sliceIdsTableRow: ref(cars),
  componentsTable: 'pricesTable',
  add: {
    vimuna: ref(vimunaPrice),
    ivoel: ref(ivoelPrice),
    rivel: ref(rivelPrice),
    amar: ref(amarPrice),
  },
});

// Each kind of layer lives in a layers table of its own
const colorLayersTable = hip<LayersTable>({
  _type: 'layers',
  _data: [colorLayer],
});

const brandLayersTable = hip<LayersTable>({
  _type: 'layers',
  _data: [brandLayer],
});

const priceLayersTable = hip<LayersTable>({
  _type: 'layers',
  _data: [priceLayer],
});
// #endregion layers

// #region cake
// The cake composes the three layers into one catalog
const carCake = hip<Cake>({
  sliceIdsTable: 'carsTable',
  sliceIdsRow: ref(cars),
  layers: {
    colorLayersTable: ref(colorLayer),
    brandLayersTable: ref(brandLayer),
    priceLayersTable: ref(priceLayer),
  },
});

// The table hosting the cake
const carCakesTable = hip<CakesTable>({ _type: 'cakes', _data: [carCake] });

// Layers and cakes refer to tables by their keys in the Rljson object
const carCatalog: Rljson = {
  colorsTable,
  brandsTable,
  pricesTable,
  carsTable,
  colorLayersTable,
  brandLayersTable,
  priceLayersTable,
  carCakesTable,
};
// #endregion cake

// #region validate
// BaseValidator checks the cake, its layers and its slice ids
const validate = new Validate();
validate.addValidator(new BaseValidator());

const errors = await validate.run(carCatalog);
if (Object.keys(errors).length > 0) {
  throw new Error(JSON.stringify(errors, null, 2));
}
console.log('The car catalog is valid');
// #endregion validate
// #endregion app

describe('Cake tutorial', () => {
  it('lets all layers share the slice ids of the cake', () => {
    for (const layer of [colorLayer, brandLayer, priceLayer]) {
      expect(layer.sliceIdsTableRow).toBe(carCake.sliceIdsRow);
    }
  });

  it('composes the layers into a cake', async () => {
    await writeGolden('car-cakes-table.json', carCakesTable);
    expect(carCake.layers.brandLayersTable).toBe(ref(brandLayer));
  });

  it('validates the car catalog', () => {
    expect(errors).toEqual({});
  });
});
