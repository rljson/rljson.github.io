// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

// Snippets for src/content/docs/guides/generate/revisions.mdx
//
// The region "app" is the sample application of the tutorial. It runs when
// vitest imports this file. The tests below check what it has built.

// #region app
// #region config
import { Generator } from '@rljson/generator';
// #endregion config
// #region versions
import { rowOf } from '@rljson/rljson';
// #endregion versions
// #region slice-ids
import { resolveSliceIds } from '@rljson/rljson';
// #endregion slice-ids
// #region layers
import type { Layer, LayersTable, Ref, SliceId } from '@rljson/rljson';
// #endregion layers
// #region validate
import { BaseValidator, Validate } from '@rljson/rljson';
// #endregion validate
// #endregion app

import { writeGolden } from '@tssuite/golden';
import { describe, expect, it, vi } from 'vitest';

// Record what the application prints
const log = vi.spyOn(console, 'log').mockImplementation(() => {});

// #region app
// #region config
// One catalog of six cars and two revisions: the model years 2027 and 2028
const generator = new Generator({
  seed: 'revisions',
  catalogs: {
    carsPerCatalog: 6,
    startYear: 2026,
    revisions: { count: 2, addRatio: 0.3, removeRatio: 0.2, changeRatio: 0.2 },
  },
  layers: { workshops: false, parts: false, cad: false },
});
const { world } = await generator.generate();
// #endregion config

// #region versions
// Every version is a cake. The manufacturer lists them all, oldest first.
const [manufacturer] = world.manufacturers._data;
const versions = manufacturer.catalogsRef.map((catalogRef) =>
  rowOf(world.catalogs, catalogRef),
);
console.log(versions.map((cake) => cake.id).join(' → '));
// #endregion versions

// #region slice-ids
// The slice ids of a year build on the year before
for (const cake of versions) {
  const sliceIds = rowOf(world.carIds, cake.sliceIdsRow);
  const cars = resolveSliceIds(world.carIds, sliceIds);
  console.log(
    `${cake.id}: ${cars.length} cars, ` +
      `${sliceIds.add.length} added, ${sliceIds.remove?.length ?? 0} removed`,
  );
}
// #endregion slice-ids

// #region layers
// A derived layer stores only what changed. Resolve it like slice ids:
// follow base, apply add, drop remove.
const resolveLayer = (
  table: LayersTable,
  layer: Layer,
): Record<SliceId, Ref> => {
  const result = layer.base
    ? resolveLayer(table, rowOf(table, layer.base))
    : {};
  for (const [sliceId, componentRef] of Object.entries(layer.add)) {
    if (!sliceId.startsWith('_')) result[sliceId] = componentRef;
  }
  for (const sliceId of Object.keys(layer.remove ?? {})) {
    delete result[sliceId];
  }
  return result;
};

for (const cake of versions) {
  const layer = rowOf(world.carPrices, cake.layers.carPrices);
  const prices = resolveLayer(world.carPrices, layer);
  const added = Object.keys(layer.add).filter((k) => !k.startsWith('_'));
  console.log(
    `${cake.id}: ${Object.keys(prices).length} prices, ` +
      `${added.length} in add, base: ${layer.base ? 'yes' : 'no'}`,
  );
}
// #endregion layers

// #region revisions
// The revisions table links each version to the next
for (const revision of world.revisions._data) {
  const from = rowOf(world.catalogs, revision.predecessor);
  const to = rowOf(world.catalogs, revision.successor);
  const date = new Date(revision.timestamp).toISOString().slice(0, 10);
  console.log(`${revision.table}: ${from.id} → ${to.id} on ${date}`);
}
// #endregion revisions

// #region validate
// BaseValidator checks the derived slice ids, the layers and the cakes
const validate = new Validate();
validate.addValidator(new BaseValidator());

const errors = await validate.run(world);
if (Object.keys(errors).length > 0) {
  throw new Error(JSON.stringify(errors, null, 2));
}
console.log('The car world is valid');
// #endregion validate
// #endregion app

const output = log.mock.calls.map((args) => args.join(' ')).join('\n');
log.mockRestore();

describe('Revisions tutorial', () => {
  it('generates three versions of the catalog', () => {
    expect(versions).toHaveLength(3);
    expect(versions.map((cake) => cake.id)).toEqual(
      versions.map((cake) => cake.id).sort(),
    );
    expect(world.catalogs._data).toHaveLength(3);
  });

  it('derives the slice ids of each year from the year before', () => {
    const [first, second, third] = versions.map((cake) =>
      rowOf(world.carIds, cake.sliceIdsRow),
    );
    expect(first.base).toBeUndefined();
    expect(first.add).toHaveLength(6);
    expect(second.base).toBe(first._hash);
    expect(third.base).toBe(second._hash);
  });

  it('derives the layers and resolves a price for every car', () => {
    for (const cake of versions) {
      const layer = rowOf(world.carPrices, cake.layers.carPrices);
      const cars = resolveSliceIds(
        world.carIds,
        rowOf(world.carIds, cake.sliceIdsRow),
      );
      const prices = resolveLayer(world.carPrices, layer);
      expect(Object.keys(prices).sort()).toEqual([...cars].sort());
      expect(layer.sliceIdsTableRow).toBe(cake.sliceIdsRow);
    }
    const [, second] = versions;
    expect(rowOf(world.carPrices, second.layers.carPrices).base).toBeDefined();
  });

  it('links the versions with revisions', () => {
    expect(world.revisions._data).toHaveLength(2);
    const [first, second, third] = versions;
    expect(world.revisions._data[0].predecessor).toBe(first._hash);
    expect(world.revisions._data[0].successor).toBe(second._hash);
    expect(world.revisions._data[1].successor).toBe(third._hash);
    expect(
      new Date(world.revisions._data[0].timestamp).toISOString(),
    ).toBe('2027-01-01T00:00:00.000Z');
  });

  it('validates the world', () => {
    expect(errors).toEqual({});
  });

  it('prints the versions', async () => {
    await writeGolden('output.txt', output);

    expect(output).toContain('2026 → ');
    expect(output).toContain('base: no');
    expect(output).toContain('base: yes');
    expect(output).toContain('on 2027-01-01');
  });
});
