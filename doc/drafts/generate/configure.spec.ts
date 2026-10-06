// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

// Snippets for src/content/docs/guides/generate/configure.mdx
//
// The region "app" is the sample application of the tutorial. It runs when
// vitest imports this file. The tests below check what it has built.

// #region app
// #region config
import { Generator } from '@rljson/generator';
import type { GeneratorConfig } from '@rljson/generator';
// #endregion config
// #region zipf
import { rowOf } from '@rljson/rljson';
// #endregion zipf
// #endregion app

import { writeGolden } from '@tssuite/golden';
import { describe, expect, it, vi } from 'vitest';

// Record what the application prints
const log = vi.spyOn(console, 'log').mockImplementation(() => {});

// #region app
// #region config
// Sizes, layers and value ranges of the world
const config: GeneratorConfig = {
  seed: 'configure',
  manufacturers: { count: 2, catalogsPerManufacturer: 1 },
  catalogs: { carsPerCatalog: { min: 8, max: 12 } },
  layers: {
    prices: {
      currencies: ['EUR', 'CHF'],
      range: { min: 20000, max: 80000 },
      roundTo: 100,
    },
    brands: { modelsPerBrand: 3, popularity: 'zipf' },
    workshops: { perCatalog: 3 },
    parts: false,
    cad: false,
  },
};
const generator = new Generator(config);
// #endregion config

// #region estimate
// The estimate counts the rows before anything is generated
const estimate = generator.estimate();
console.log(`estimated: ${estimate.cars} cars, ${estimate.rowsTotal} rows`);
for (const [table, rows] of Object.entries(estimate.rowsPerTable)) {
  console.log(`  ${table.padEnd(18)} ${rows}`);
}
// #endregion estimate

// #region generate
const { world, stats } = await generator.generate();
console.log(`generated: ${stats.cars} cars, ${stats.rowsTotal} rows`);
// #endregion generate

// #region layers-off
// Without parts and CAD, every cake has three layers
const [catalog] = world.catalogs._data;
const layers = Object.keys(catalog.layers).filter((k) => !k.startsWith('_'));
console.log(`layers: ${layers.join(', ')}`);
console.log(`parts: ${world.parts._data.length} rows`);
// #endregion layers-off

// #region values
// The prices stay inside the configured range and currencies
const amounts = world.prices._data.map((price) => price.amount);
const currencies = new Set(world.prices._data.map((price) => price.currency));
console.log(`prices: ${Math.min(...amounts)} to ${Math.max(...amounts)}`);
console.log(`currencies: ${[...currencies].sort().join(', ')}`);
// #endregion values

// #region zipf
// Zipf popularity: a few models get most of the cars
const carsPerModel = new Map<string, number>();
for (const layer of world.carBrands._data) {
  for (const [carId, brandRef] of Object.entries(layer.add)) {
    if (carId.startsWith('_')) continue;
    const { model } = rowOf(world.brands, brandRef);
    carsPerModel.set(model, (carsPerModel.get(model) ?? 0) + 1);
  }
}
const byCount = [...carsPerModel].sort((a, b) => b[1] - a[1]);
for (const [model, count] of byCount) {
  console.log(`  ${model.padEnd(12)} ${'#'.repeat(count)}`);
}
// #endregion zipf

// #region resolved
// The resolved configuration has every default filled in
const resolved = generator.config;
console.log(`cars per catalog: ${JSON.stringify(resolved.catalogs.carsPerCatalog)}`);
console.log(`start year: ${resolved.catalogs.startYear}`);
// #endregion resolved
// #endregion app

const output = log.mock.calls.map((args) => args.join(' ')).join('\n');
log.mockRestore();

describe('Configure tutorial', () => {
  it('draws the catalog sizes from the configured range', () => {
    expect(world.catalogs._data).toHaveLength(2);
    expect(stats.cars).toBeGreaterThanOrEqual(16);
    expect(stats.cars).toBeLessThanOrEqual(24);
  });

  it('estimates what the run produces', () => {
    expect(estimate.cars).toBe(stats.cars);
    expect(stats.rowsTotal).toBeLessThanOrEqual(estimate.rowsTotal);
  });

  it('leaves the parts and CAD layers out', () => {
    expect(layers).toEqual(['carPrices', 'carBrands', 'carWorkshops']);
    expect(world.parts._data).toHaveLength(0);
    expect(world.carParts._data).toHaveLength(0);
  });

  it('keeps the prices inside the configured values', () => {
    for (const price of world.prices._data) {
      expect(price.amount).toBeGreaterThanOrEqual(20000);
      expect(price.amount).toBeLessThanOrEqual(80000);
      expect(price.amount % 100).toBe(0);
      expect(['EUR', 'CHF']).toContain(price.currency);
    }
  });

  it('gives the most popular model the most cars', () => {
    expect(byCount[0][1]).toBeGreaterThan(byCount[byCount.length - 1][1]);
  });

  it('fills the defaults into the resolved configuration', async () => {
    await writeGolden('config.json', JSON.parse(JSON.stringify(resolved)));

    expect(resolved.seed).toBe('configure');
    expect(resolved.catalogs.carsPerCatalog).toEqual({ min: 8, max: 12 });
    expect(resolved.catalogs.startYear).toBe(2026);
  });

  it('prints the estimate, the values and the popularity', async () => {
    await writeGolden('output.txt', output);

    expect(output).toContain('estimated:');
    expect(output).toContain('generated:');
    expect(output).toContain('currencies: CHF, EUR');
    expect(output).toContain('start year: 2026');
  });
});
