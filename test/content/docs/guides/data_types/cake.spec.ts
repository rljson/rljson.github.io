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

const brakes = hip<ComponentsTable<Part>>({
  _type: 'components',
  _data: [{ name: '410 mm brake' }, { name: '365 mm brake' }],
});

const rims = hip<ComponentsTable<Part>>({
  _type: 'components',
  _data: [{ name: '20″ rim' }, { name: '21″ rim' }],
});

const tires = hip<ComponentsTable<Part>>({
  _type: 'components',
  _data: [
    { name: '245/45 R20 summer' },
    { name: '285/40 R21 summer' },
    { name: '245/45 R20 winter' },
    { name: '285/40 R21 winter' },
  ],
});
// #endregion parts

// #region slices
const axles = hip<SliceIdsTable>({
  _type: 'sliceIds',
  _data: [{ add: ['front', 'rear'] }],
});

const bothAxles = axles._data[0];
// #endregion slices

// #region layers
/** Returns the reference to a row: the hash that hip wrote into it */
const ref = (row: object): Ref => (row as { _hash: Ref })._hash;

/** Creates a layer that assigns a part to each axle of the car */
const createLayer = (componentsTable: string, front: object, rear: object) =>
  hip<Layer>({
    sliceIdsTable: 'axles',
    sliceIdsTableRow: ref(bothAxles),
    componentsTable,
    add: { front: ref(front), rear: ref(rear) },
  });

const [frontBrake, rearBrake] = brakes._data;
const [frontRim, rearRim] = rims._data;
const [summerFront, summerRear, winterFront, winterRear] = tires._data;

const brakeLayer = createLayer('brakes', frontBrake, rearBrake);
const rimLayer = createLayer('rims', frontRim, rearRim);
const summerTires = createLayer('tires', summerFront, summerRear);
// #endregion layers

// #region cake
const summerSetup = hip<Cake>({
  id: 'summerSetup',
  sliceIdsTable: 'axles',
  sliceIdsRow: ref(bothAxles),
  layers: {
    brakeLayers: ref(brakeLayer),
    rimLayers: ref(rimLayer),
    tireLayers: ref(summerTires),
  },
});
// #endregion cake

// #region variant
const winterTires = createLayer('tires', winterFront, winterRear);

const winterSetup = hip<Cake>({
  id: 'winterSetup',
  sliceIdsTable: 'axles',
  sliceIdsRow: ref(bothAxles),
  layers: {
    brakeLayers: ref(brakeLayer), // the same as in the summer setup
    rimLayers: ref(rimLayer), // the same as in the summer setup
    tireLayers: ref(winterTires),
  },
});
// #endregion variant

// #region tables
const brakeLayers = hip<LayersTable>({
  _type: 'layers',
  _data: [brakeLayer],
});

const rimLayers = hip<LayersTable>({
  _type: 'layers',
  _data: [rimLayer],
});

const tireLayers = hip<LayersTable>({
  _type: 'layers',
  _data: [summerTires, winterTires],
});

const wheelSetups = hip<CakesTable>({
  _type: 'cakes',
  _data: [summerSetup, winterSetup],
});

const wheelShop: Rljson = {
  brakes,
  rims,
  tires,
  axles,
  brakeLayers,
  rimLayers,
  tireLayers,
  wheelSetups,
};
// #endregion tables

// #region validate
const validate = new Validate();
validate.addValidator(new BaseValidator());

const errors = await validate.run(wheelShop);
if (Object.keys(errors).length > 0) {
  throw new Error(JSON.stringify(errors, null, 2));
}
// #endregion validate

// #region serve
/** Finds the row with the given hash in a table of the wheel shop */
const rowOf = (tableKey: string, hash: Ref) =>
  wheelShop[tableKey]._data.find((row) => ref(row) === hash);

/** Returns what goes onto one axle of a setup: a part from each layer */
const partsOf = (setup: Cake, sliceId: string) =>
  Object.entries(setup.layers)
    .filter(([layersTable]) => !layersTable.startsWith('_')) // skip _hash
    .map(([layersTable, layerRef]) => {
      const layer: Layer = rowOf(layersTable, layerRef);
      return rowOf(layer.componentsTable, layer.add[sliceId]).name;
    });

for (const setup of wheelSetups._data) {
  const { add: sliceIds } = rowOf(setup.sliceIdsTable, setup.sliceIdsRow);

  console.log(`${setup.id}:`);
  for (const sliceId of sliceIds) {
    console.log(`  ${sliceId}: ${partsOf(setup, sliceId).join(', ')}`);
  }
}
// #endregion serve
// #endregion app

const output = log.mock.calls.map((args) => args.join(' ')).join('\n');
log.mockRestore();

describe('Cake tutorial', () => {
  it('lets all layers share the slice ids of the wheel setup', () => {
    for (const layer of [brakeLayer, rimLayer, summerTires]) {
      expect(layer.sliceIdsTableRow).toBe(summerSetup.sliceIdsRow);
    }
  });

  it('stacks layers into wheel setups', async () => {
    await writeGolden('wheel-setups.json', wheelSetups);

    expect(winterSetup.layers.brakeLayers).toBe(summerSetup.layers.brakeLayers);
    expect(winterSetup.layers.rimLayers).toBe(summerSetup.layers.rimLayers);
    expect(winterSetup.layers.tireLayers).not.toBe(
      summerSetup.layers.tireLayers,
    );
  });

  it('validates the wheel shop', () => {
    expect(errors).toEqual({});
  });

  it('mounts the wheels of each setup', async () => {
    await writeGolden('output.txt', output);

    expect(output).toBe(
      [
        'summerSetup:',
        '  front: 410 mm brake, 20″ rim, 245/45 R20 summer',
        '  rear: 365 mm brake, 21″ rim, 285/40 R21 summer',
        'winterSetup:',
        '  front: 410 mm brake, 20″ rim, 245/45 R20 winter',
        '  rear: 365 mm brake, 21″ rim, 285/40 R21 winter',
      ].join('\n'),
    );
  });

  it('detects a wheel setup with a missing layer', async () => {
    // #region missing-layer
    const mixedTires = createLayer('tires', winterFront, summerRear);

    const mixedSetup = hip<Cake>({
      id: 'mixedSetup',
      sliceIdsTable: 'axles',
      sliceIdsRow: ref(bothAxles),
      layers: {
        brakeLayers: ref(brakeLayer),
        rimLayers: ref(rimLayer),
        tireLayers: ref(mixedTires), // not added to tireLayers
      },
    });

    const result = await validate.run({
      ...wheelShop,
      wheelSetups: hip<CakesTable>({ _type: 'cakes', _data: [mixedSetup] }),
    });
    // #endregion missing-layer

    await writeGolden('missing-layer.json', result);
    expect(result.base.cakeLayersNotFound).toEqual({
      error: 'Layer layers of cakes are missing',
      brokenCakes: [
        {
          cakeTable: 'wheelSetups',
          brokenCake: ref(mixedSetup),
          layersTable: 'tireLayers',
          missingLayer: ref(mixedTires),
        },
      ],
    });
  });
});
