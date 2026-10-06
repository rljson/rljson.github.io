// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

// Snippets for src/content/docs/guides/generate/parts-and-cad.mdx
//
// The region "app" is the sample application of the tutorial. It runs when
// vitest imports this file. The tests below check what it has built.

// #region app
// #region config
import { Generator } from '@rljson/generator';
// #endregion config
// #region bom
import { resolveSliceIds, rowOf } from '@rljson/rljson';
// #endregion bom
// #region walk
import type { Part } from '@rljson/generator';
// #endregion walk
// #region cad
import type { CadMeta } from '@rljson/generator';
import type { Tree } from '@rljson/rljson';
// #endregion cad
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
// One catalog of three cars with small trees
const generator = new Generator({
  seed: 'parts-and-cad',
  catalogs: { carsPerCatalog: 3 },
  layers: {
    parts: { depth: 3, fanOut: 2, sharing: 'perModel', standardPartsPool: 6 },
    cad: { depth: 2, fanOut: 3, linkToParts: true },
  },
});
const { world, stats } = await generator.generate();
// #endregion config

// #region bom
// The parts layer assigns a bill of materials to every car: a part of
// level 0 that refers to its sub parts
const [catalog] = world.catalogs._data;
const carIds = resolveSliceIds(
  world.carIds,
  rowOf(world.carIds, catalog.sliceIdsRow),
);
const partsLayer = rowOf(world.carParts, catalog.layers.carParts);

const [firstCar] = carIds;
const bom = rowOf(world.parts, partsLayer.add[firstCar]);
console.log(`${firstCar}: ${bom.name}, ${bom.subPartRefs.length} assemblies`);
// #endregion bom

// #region walk
// Follow subPartRefs down to the leaves
const printPart = (part: Part, indent = ''): void => {
  console.log(`${indent}${part.name} (${part.partNumber}) × ${part.quantity}`);
  for (const subPartRef of part.subPartRefs) {
    printPart(rowOf(world.parts, subPartRef), indent + '  ');
  }
};
printPart(bom);
// #endregion walk

// #region shared
// Count the parts reached from every car, and the rows that store them
const countParts = (part: Part): number =>
  part.subPartRefs.reduce(
    (sum, ref) => sum + countParts(rowOf(world.parts, ref)),
    1,
  );

let references = 0;
for (const carId of carIds) {
  references += countParts(rowOf(world.parts, partsLayer.add[carId]));
}
console.log(`${references} part references, ${world.parts._data.length} rows`);
// #endregion shared

// #region cad
// The CAD layer assigns a scene to every car: the root node of a tree
const cadLayer = rowOf(world.carCad, catalog.layers.carCad);

const printNode = (node: Tree, indent = ''): void => {
  const meta = node.meta as CadMeta;
  const detail =
    meta.type === 'mesh'
      ? `${meta.vertices} vertices`
      : `${node.children?.length ?? 0} children`;
  const part = meta.partRef ? `, shows ${rowOf(world.parts, meta.partRef).name}` : '';

  console.log(`${indent}${node.id}: ${meta.type}, ${detail}${part}`);
  for (const childRef of node.children ?? []) {
    printNode(rowOf(world.cadScenes, childRef), indent + '  ');
  }
};
printNode(rowOf(world.cadScenes, cadLayer.add[firstCar]));
// #endregion cad

// #region validate
// BaseValidator checks the sub parts, the nodes and both layers
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

describe('Parts and CAD tutorial', () => {
  const depthOf = (part: Part): number =>
    1 + Math.max(0, ...part.subPartRefs.map((r) => depthOf(rowOf(world.parts, r))));

  it('assigns a bill of materials three levels deep to every car', () => {
    for (const carId of carIds) {
      const root = rowOf(world.parts, partsLayer.add[carId]);
      expect(root.level).toBe(0);
      expect(depthOf(root)).toBe(4);
    }
  });

  it('shares parts between the cars', () => {
    expect(references).toBeGreaterThan(world.parts._data.length);
    expect(stats.dedupRatio).toBeGreaterThan(0);
  });

  it('links every mesh to a part', () => {
    for (const node of world.cadScenes._data) {
      const meta = node.meta as CadMeta;
      if (meta.type === 'mesh') {
        expect(meta.partRef).toBeTypeOf('string');
        expect(() => rowOf(world.parts, meta.partRef!)).not.toThrow();
      }
    }
  });

  it('validates the world', () => {
    expect(errors).toEqual({});
  });

  it('prints the trees', async () => {
    await writeGolden('output.txt', output);

    expect(output).toContain('assemblies');
    expect(output).toContain('part references');
    expect(output).toContain('vertices');
    expect(output).toContain('The car world is valid');
  });
});
