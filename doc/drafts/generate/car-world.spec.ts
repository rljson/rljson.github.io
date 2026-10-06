// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

// Snippets for src/content/docs/guides/generate/car-world.mdx
//
// The region "app" is the sample application of the tutorial. It runs when
// vitest imports this file. The tests below check what it has built.

// #region app
// #region generate
import { Generator } from '@rljson/generator';
// #endregion generate
// #region manufacturers
import { rowOf } from '@rljson/rljson';
// #endregion manufacturers
// #region catalogs
import { resolveSliceIds } from '@rljson/rljson';
// #endregion catalogs
// #endregion app

import { writeGolden } from '@tssuite/golden';
import { describe, expect, it, vi } from 'vitest';

// Record what the application prints
const log = vi.spyOn(console, 'log').mockImplementation(() => {});

// #region app
// #region generate
// Two manufacturers with one catalog of four cars each
const generator = new Generator({
  seed: 'car-world',
  manufacturers: { count: 2, catalogsPerManufacturer: 1 },
  catalogs: { carsPerCatalog: 4 },
  layers: { workshops: { perCatalog: 2 }, parts: false, cad: false },
});
const { world, stats } = await generator.generate();
// #endregion generate

// #region manufacturers
// The manufacturers are the entry point: one row each, nothing above them
for (const manufacturer of world.manufacturers._data) {
  const headquarters = rowOf(world.addresses, manufacturer.headquartersRef);
  console.log(
    `${manufacturer.name}, ${headquarters.city} (${manufacturer.country}), ` +
      `founded ${manufacturer.founded}`,
  );
}
// #endregion manufacturers

// #region catalogs
// A manufacturer lists its catalogs by their hashes. A catalog is a cake:
// its slice ids row lists the cars, its layers describe them.
const [manufacturer] = world.manufacturers._data;

for (const catalogRef of manufacturer.catalogsRef) {
  const catalog = rowOf(world.catalogs, catalogRef);
  const sliceIds = rowOf(world.carIds, catalog.sliceIdsRow);
  const carIds = resolveSliceIds(world.carIds, sliceIds);
  const layers = Object.keys(catalog.layers).filter((k) => !k.startsWith('_'));

  console.log(`${catalog.id}: ${carIds.length} cars`);
  console.log(`  layers: ${layers.join(', ')}`);
}
// #endregion catalogs

// #region cars
// Each layer assigns one component to every car
const catalog = rowOf(world.catalogs, manufacturer.catalogsRef[0]);
const carIds = resolveSliceIds(
  world.carIds,
  rowOf(world.carIds, catalog.sliceIdsRow),
);

const priceLayer = rowOf(world.carPrices, catalog.layers.carPrices);
const brandLayer = rowOf(world.carBrands, catalog.layers.carBrands);
const workshopLayer = rowOf(world.carWorkshops, catalog.layers.carWorkshops);

for (const carId of carIds) {
  const price = rowOf(world.prices, priceLayer.add[carId]);
  const brand = rowOf(world.brands, brandLayer.add[carId]);
  const workshop = rowOf(world.workshops, workshopLayer.add[carId]);

  console.log(
    `${carId}: ${brand.brand} ${brand.model} ${brand.modelYear}, ` +
      `${price.amount} ${price.currency}, serviced by ${workshop.name}`,
  );
}
// #endregion cars

// #region workshops
// A workshop refers to its address and to its owner
for (const workshop of world.workshops._data) {
  const address = rowOf(world.addresses, workshop.addressRef);
  const owner = rowOf(world.persons, workshop.ownerRef);
  console.log(
    `${workshop.name}, ${address.zip} ${address.city}, ` +
      `owned by ${owner.firstName} ${owner.lastName}`,
  );
}
// #endregion workshops

// #region shared
// Equal content has an equal hash and is stored once
console.log(
  `${stats.cars} cars share ${world.brands._data.length} brands ` +
    `and ${world.workshops._data.length} workshops`,
);
// #endregion shared
// #endregion app

const output = log.mock.calls.map((args) => args.join(' ')).join('\n');
log.mockRestore();

describe('Car world tutorial', () => {
  it('lists two manufacturers with one catalog each', () => {
    expect(world.manufacturers._data).toHaveLength(2);
    expect(manufacturer.catalogsRef).toHaveLength(1);
    expect(carIds).toHaveLength(4);
    expect(stats.cars).toBe(8);
  });

  it('assigns a price, a brand and a workshop to every car', () => {
    for (const carId of carIds) {
      expect(priceLayer.add[carId]).toBeDefined();
      expect(brandLayer.add[carId]).toBeDefined();
      expect(workshopLayer.add[carId]).toBeDefined();
    }
  });

  it('switches parts and CAD off', () => {
    const layers = Object.keys(catalog.layers).filter(
      (k) => !k.startsWith('_'),
    );
    expect(layers).toEqual(['carPrices', 'carBrands', 'carWorkshops']);
    expect(world.parts._data).toHaveLength(0);
    expect(world.cadScenes._data).toHaveLength(0);
  });

  it('prints the walk', async () => {
    await writeGolden('output.txt', output);

    expect(output).toContain('layers: carPrices, carBrands, carWorkshops');
    expect(output).toContain('serviced by');
    expect(output).toContain('owned by');
    expect(output).toContain('8 cars share');
  });
});
