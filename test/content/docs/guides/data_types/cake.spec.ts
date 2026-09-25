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
// #region parts
import { hip } from '@rljson/hash';
import type { ComponentsTable } from '@rljson/rljson';
// #endregion parts
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
// #region parts
type Part = { name: string };

const sponges = hip<ComponentsTable<Part>>({
  _type: 'components',
  _data: [{ name: 'vanilla sponge' }, { name: 'chocolate sponge' }],
});

const creams = hip<ComponentsTable<Part>>({
  _type: 'components',
  _data: [{ name: 'vanilla cream' }, { name: 'chocolate cream' }],
});

const toppings = hip<ComponentsTable<Part>>({
  _type: 'components',
  _data: [
    { name: 'strawberries' },
    { name: 'raspberries' },
    { name: 'chocolate flakes' },
  ],
});
// #endregion parts

// #region slices
const slices = hip<SliceIdsTable>({
  _type: 'sliceIds',
  _data: [{ add: ['left', 'right'] }],
});

const halves = slices._data[0];
// #endregion slices

// #region layers
/** Returns the reference to a row: the hash that hip wrote into it */
const ref = (row: object): Ref => (row as { _hash: Ref })._hash;

/** Creates a layer that assigns a part to each half of the cake */
const createLayer = (componentsTable: string, left: object, right: object) =>
  hip<Layer>({
    sliceIdsTable: 'slices',
    sliceIdsTableRow: ref(halves),
    componentsTable,
    add: { left: ref(left), right: ref(right) },
  });

const [vanillaSponge, chocolateSponge] = sponges._data;
const [vanillaCream, chocolateCream] = creams._data;
const [strawberries, raspberries, chocolateFlakes] = toppings._data;

const spongeLayer = createLayer('sponges', vanillaSponge, chocolateSponge);
const creamLayer = createLayer('creams', vanillaCream, chocolateCream);
const berryTopping = createLayer('toppings', strawberries, raspberries);
// #endregion layers

// #region cake
const berryCake = hip<Cake>({
  id: 'berryCake',
  sliceIdsTable: 'slices',
  sliceIdsRow: ref(halves),
  layers: {
    spongeLayers: ref(spongeLayer),
    creamLayers: ref(creamLayer),
    toppingLayers: ref(berryTopping),
  },
});
// #endregion cake

// #region variant
const chocolateTopping = createLayer(
  'toppings',
  chocolateFlakes,
  chocolateFlakes,
);

const chocolateCake = hip<Cake>({
  id: 'chocolateCake',
  sliceIdsTable: 'slices',
  sliceIdsRow: ref(halves),
  layers: {
    spongeLayers: ref(spongeLayer), // the same as in the berry cake
    creamLayers: ref(creamLayer), // the same as in the berry cake
    toppingLayers: ref(chocolateTopping),
  },
});
// #endregion variant

// #region tables
const spongeLayers = hip<LayersTable>({
  _type: 'layers',
  _data: [spongeLayer],
});

const creamLayers = hip<LayersTable>({
  _type: 'layers',
  _data: [creamLayer],
});

const toppingLayers = hip<LayersTable>({
  _type: 'layers',
  _data: [berryTopping, chocolateTopping],
});

const cakes = hip<CakesTable>({
  _type: 'cakes',
  _data: [berryCake, chocolateCake],
});

const cakeShop: Rljson = {
  sponges,
  creams,
  toppings,
  slices,
  spongeLayers,
  creamLayers,
  toppingLayers,
  cakes,
};
// #endregion tables

// #region validate
const validate = new Validate();
validate.addValidator(new BaseValidator());

const errors = await validate.run(cakeShop);
if (Object.keys(errors).length > 0) {
  throw new Error(JSON.stringify(errors, null, 2));
}
// #endregion validate

// #region serve
/** Finds the row with the given hash in a table of the cake shop */
const rowOf = (tableKey: string, hash: Ref) =>
  cakeShop[tableKey]._data.find((row) => ref(row) === hash);

/** Returns what one slice of a cake is made of: a part from each layer */
const partsOf = (cake: Cake, sliceId: string) =>
  Object.entries(cake.layers)
    .filter(([layersTable]) => !layersTable.startsWith('_')) // skip _hash
    .map(([layersTable, layerRef]) => {
      const layer: Layer = rowOf(layersTable, layerRef);
      return rowOf(layer.componentsTable, layer.add[sliceId]).name;
    });

for (const cake of cakes._data) {
  const { add: sliceIds } = rowOf(cake.sliceIdsTable, cake.sliceIdsRow);

  console.log(`${cake.id}:`);
  for (const sliceId of sliceIds) {
    console.log(`  ${sliceId}: ${partsOf(cake, sliceId).join(', ')}`);
  }
}
// #endregion serve
// #endregion app

const output = log.mock.calls.map((args) => args.join(' ')).join('\n');
log.mockRestore();

describe('Cake tutorial', () => {
  it('lets all layers share the slice ids of the cake', () => {
    for (const layer of [spongeLayer, creamLayer, berryTopping]) {
      expect(layer.sliceIdsTableRow).toBe(berryCake.sliceIdsRow);
    }
  });

  it('stacks layers into cakes', async () => {
    await writeGolden('cakes.json', cakes);

    expect(chocolateCake.layers.spongeLayers).toBe(
      berryCake.layers.spongeLayers,
    );
    expect(chocolateCake.layers.toppingLayers).not.toBe(
      berryCake.layers.toppingLayers,
    );
  });

  it('validates the cake shop', () => {
    expect(errors).toEqual({});
  });

  it('serves each slice of each cake', async () => {
    await writeGolden('output.txt', output);

    expect(output).toBe(
      [
        'berryCake:',
        '  left: vanilla sponge, vanilla cream, strawberries',
        '  right: chocolate sponge, chocolate cream, raspberries',
        'chocolateCake:',
        '  left: vanilla sponge, vanilla cream, chocolate flakes',
        '  right: chocolate sponge, chocolate cream, chocolate flakes',
      ].join('\n'),
    );
  });

  it('detects a cake with a missing layer', async () => {
    // #region missing-layer
    const mixedTopping = createLayer('toppings', raspberries, strawberries);

    const mixedCake = hip<Cake>({
      id: 'mixedCake',
      sliceIdsTable: 'slices',
      sliceIdsRow: ref(halves),
      layers: {
        spongeLayers: ref(spongeLayer),
        creamLayers: ref(creamLayer),
        toppingLayers: ref(mixedTopping), // not added to toppingLayers
      },
    });

    const result = await validate.run({
      ...cakeShop,
      cakes: hip<CakesTable>({ _type: 'cakes', _data: [mixedCake] }),
    });
    // #endregion missing-layer

    await writeGolden('missing-layer.json', result);
    expect(result.base.cakeLayersNotFound).toEqual({
      error: 'Layer layers of cakes are missing',
      brokenCakes: [
        {
          cakeTable: 'cakes',
          brokenCake: ref(mixedCake),
          layersTable: 'toppingLayers',
          missingLayer: ref(mixedTopping),
        },
      ],
    });
  });
});
