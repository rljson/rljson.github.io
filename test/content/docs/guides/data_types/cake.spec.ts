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
// #region components
import { hip } from '@rljson/hash';
import type { ComponentsTable } from '@rljson/rljson';
// #endregion components
// #region slices
import type { SliceIdsTable } from '@rljson/rljson';
// #endregion slices
// #region layers
import type { Layer, Ref } from '@rljson/rljson';
// #endregion layers
// #region cake
import type { Cake } from '@rljson/rljson';
// #endregion cake
// #region tables
import type { CakesTable, LayersTable, Rljson } from '@rljson/rljson';
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
// #region components
// The components of the three layers
type Color = { name: string };
type Engine = { power: number /* kW */; drive: 'electric' | 'combustion' };
type Price = { amount: number; currency: 'EUR' | 'CHF' };

const colors = hip<ComponentsTable<Color>>({
  _type: 'components',
  _data: [{ name: 'white' }, { name: 'black' }],
});

const engines = hip<ComponentsTable<Engine>>({
  _type: 'components',
  _data: [
    { power: 300, drive: 'electric' },
    { power: 200, drive: 'electric' },
  ],
});

const prices = hip<ComponentsTable<Price>>({
  _type: 'components',
  _data: [
    { amount: 101000, currency: 'EUR' },
    { amount: 36000, currency: 'EUR' },
    { amount: 108000, currency: 'CHF' },
    { amount: 38000, currency: 'CHF' },
  ],
});
// #endregion components

// #region slices
// The cars of the catalog: the slice ids all layers share
const cars = hip<SliceIdsTable>({
  _type: 'sliceIds',
  _data: [{ add: ['taycan', 'ex30'] }],
});

const models = cars._data[0];
// #endregion slices

// #region layers
/** Returns the reference to a row: the hash that hip wrote into it */
const ref = (row: object): Ref => (row as { _hash: Ref })._hash;

/** Creates a layer that assigns a component to each car of the catalog */
const createLayer = (componentsTable: string, taycan: object, ex30: object) =>
  hip<Layer>({
    sliceIdsTable: 'cars',
    sliceIdsTableRow: ref(models),
    componentsTable,
    add: { taycan: ref(taycan), ex30: ref(ex30) },
  });

// The components of each car: the Taycan first, then the EX30
const [white, black] = colors._data;
const [strongEngine, smallEngine] = engines._data;
const [taycanEur, ex30Eur, taycanChf, ex30Chf] = prices._data;

// One layer per aspect of the cars
const colorLayer = createLayer('colors', white, black);
const engineLayer = createLayer('engines', strongEngine, smallEngine);
const germanPrices = createLayer('prices', taycanEur, ex30Eur);
// #endregion layers

// #region cake
// The German catalog stacks the three layers onto the cars
const germany = hip<Cake>({
  id: 'germany',
  sliceIdsTable: 'cars',
  sliceIdsRow: ref(models),
  layers: {
    colorLayers: ref(colorLayer),
    engineLayers: ref(engineLayer),
    priceLayers: ref(germanPrices),
  },
});
// #endregion cake

// #region variant
// Switzerland differs only in its prices
const swissPrices = createLayer('prices', taycanChf, ex30Chf);

const switzerland = hip<Cake>({
  id: 'switzerland',
  sliceIdsTable: 'cars',
  sliceIdsRow: ref(models),
  layers: {
    colorLayers: ref(colorLayer), // the same as in Germany
    engineLayers: ref(engineLayer), // the same as in Germany
    priceLayers: ref(swissPrices),
  },
});
// #endregion variant

// #region tables
// Each kind of layer lives in a layers table of its own
const colorLayers = hip<LayersTable>({
  _type: 'layers',
  _data: [colorLayer],
});

const engineLayers = hip<LayersTable>({
  _type: 'layers',
  _data: [engineLayer],
});

const priceLayers = hip<LayersTable>({
  _type: 'layers',
  _data: [germanPrices, swissPrices],
});

// Both catalogs live in one cakes table
const catalogs = hip<CakesTable>({
  _type: 'cakes',
  _data: [germany, switzerland],
});

// The keys are the table names that the layers and cakes refer to
const carMarket: Rljson = {
  colors,
  engines,
  prices,
  cars,
  colorLayers,
  engineLayers,
  priceLayers,
  catalogs,
};
// #endregion tables

// #region validate
// BaseValidator also checks the layers and slice ids of every cake
const validate = new Validate();
validate.addValidator(new BaseValidator());

const errors = await validate.run(carMarket);
if (Object.keys(errors).length > 0) {
  throw new Error(JSON.stringify(errors, null, 2));
}
// #endregion validate

// #region read
/** Finds the row with the given hash in a table of the car market */
const rowOf = (tableKey: string, hash: Ref) =>
  carMarket[tableKey]._data.find((row) => ref(row) === hash);

/** Describes a component in words, one formatter per components table */
const formats = {
  colors: (color: Color) => color.name,
  engines: (engine: Engine) => `${engine.power} kW ${engine.drive}`,
  prices: (price: Price) =>
    `${price.amount.toLocaleString('en-US')} ${price.currency}`,
};

/** Describes one car of a catalog: a component from each layer */
const describeCar = (catalog: Cake, sliceId: string) =>
  Object.entries(catalog.layers)
    .filter(([layersTable]) => !layersTable.startsWith('_')) // skip _hash
    .map(([layersTable, layerRef]) => {
      const layer: Layer = rowOf(layersTable, layerRef);
      const component = rowOf(layer.componentsTable, layer.add[sliceId]);
      const format = formats[layer.componentsTable as keyof typeof formats];
      return format(component);
    });

// Print every car of every catalog with its color, engine and price
for (const catalog of catalogs._data) {
  const { add: sliceIds } = rowOf(catalog.sliceIdsTable, catalog.sliceIdsRow);

  console.log(`${catalog.id}:`);
  for (const sliceId of sliceIds) {
    console.log(`  ${sliceId}: ${describeCar(catalog, sliceId).join(', ')}`);
  }
}
// #endregion read
// #endregion app

const output = log.mock.calls.map((args) => args.join(' ')).join('\n');
log.mockRestore();

describe('Cake tutorial', () => {
  it('lets all layers share the slice ids of the catalog', () => {
    for (const layer of [colorLayer, engineLayer, germanPrices, swissPrices]) {
      expect(layer.sliceIdsTableRow).toBe(germany.sliceIdsRow);
    }
    expect(switzerland.sliceIdsRow).toBe(germany.sliceIdsRow);
  });

  it('stacks layers into catalogs', async () => {
    await writeGolden('catalogs.json', catalogs);

    expect(switzerland.layers.colorLayers).toBe(germany.layers.colorLayers);
    expect(switzerland.layers.engineLayers).toBe(germany.layers.engineLayers);
    expect(switzerland.layers.priceLayers).not.toBe(germany.layers.priceLayers);
  });

  it('validates the car market', () => {
    expect(errors).toEqual({});
  });

  it('reads the cars of each catalog', async () => {
    await writeGolden('output.txt', output);

    expect(output).toBe(
      [
        'germany:',
        '  taycan: white, 300 kW electric, 101,000 EUR',
        '  ex30: black, 200 kW electric, 36,000 EUR',
        'switzerland:',
        '  taycan: white, 300 kW electric, 108,000 CHF',
        '  ex30: black, 200 kW electric, 38,000 CHF',
      ].join('\n'),
    );
  });

  it('detects a catalog with a missing layer', async () => {
    // #region missing-layer
    // Austria takes over the German prices with a layer of its own
    const austrianPrices = hip<Layer>({
      base: ref(germanPrices),
      sliceIdsTable: 'cars',
      sliceIdsTableRow: ref(models),
      componentsTable: 'prices',
      add: {},
    });

    const austria = hip<Cake>({
      id: 'austria',
      sliceIdsTable: 'cars',
      sliceIdsRow: ref(models),
      layers: {
        colorLayers: ref(colorLayer),
        engineLayers: ref(engineLayer),
        priceLayers: ref(austrianPrices), // not added to priceLayers
      },
    });

    const result = await validate.run({
      ...carMarket,
      catalogs: hip<CakesTable>({ _type: 'cakes', _data: [austria] }),
    });
    // #endregion missing-layer

    await writeGolden('missing-layer.json', result);
    expect(result.base.cakeLayersNotFound).toEqual({
      error: 'Layer layers of cakes are missing',
      brokenCakes: [
        {
          cakeTable: 'catalogs',
          brokenCake: ref(austria),
          layersTable: 'priceLayers',
          missingLayer: ref(austrianPrices),
        },
      ],
    });
  });
});
