// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

// Snippets for src/content/docs/guides/generate/first-dataset.mdx
//
// The region "app" is the sample application of the tutorial. It runs when
// vitest imports this file. The tests below check what it has built.

// #region app
// #region generate
import { Edge } from '@rljson/edge';
// #endregion generate
// #region tables
import { iterateTablesSync } from '@rljson/rljson';
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
// #region generate
// The smallest preset: one manufacturer with one catalog of five cars
const generator = Edge.preset('tiny');
const { world, stats } = await generator.generate();
// #endregion generate

// #region tables
// Every table has a content type and rows
iterateTablesSync(world, (key, table) => {
  console.log(
    `${key.padEnd(18)} ${table._type.padEnd(11)} ${table._data.length}`,
  );
});
// #endregion tables

// #region stats
console.log(`${stats.cars} cars, ${stats.rowsTotal} rows`);
// #endregion stats

// #region validate
// BaseValidator checks hashes, references, layers, cakes and trees
const validate = new Validate();
validate.addValidator(new BaseValidator());

const errors = await validate.run(world);
if (Object.keys(errors).length > 0) {
  throw new Error(JSON.stringify(errors, null, 2));
}
console.log('The car world is valid');
// #endregion validate

// #region reproduce
// Nothing is random: the same configuration yields the same hashes
const again = (await Edge.preset('tiny').generate()).world;
const smaller = Edge.preset('tiny', { catalogs: { carsPerCatalog: 4 } });
const other = (await smaller.generate()).world;

console.log('same config:', again.catalogs._hash === world.catalogs._hash);
console.log('other config:', other.catalogs._hash === world.catalogs._hash);
// #endregion reproduce
// #endregion app

const output = log.mock.calls.map((args) => args.join(' ')).join('\n');
log.mockRestore();

describe('First dataset tutorial', () => {
  it('generates one manufacturer with one catalog of five cars', async () => {
    await writeGolden('manufacturers.json', world.manufacturers);

    expect(world.manufacturers._data).toHaveLength(1);
    expect(world.catalogs._data).toHaveLength(1);
    expect(stats.cars).toBe(5);
    expect(stats.rowsTotal).toBeGreaterThan(20);
  });

  it('validates the world', () => {
    expect(errors).toEqual({});
  });

  it('reproduces the data from the configuration', () => {
    expect(again.catalogs._hash).toBe(world.catalogs._hash);
  });

  it('prints the tables, the statistics and the comparison', async () => {
    await writeGolden('output.txt', output);

    expect(output).toContain('catalogs           cakes       1');
    expect(output).toContain('5 cars,');
    expect(output).toContain('The car world is valid');
    expect(output).toContain('same config: true');
    expect(output).toContain('other config: false');
  });
});
