// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

// Snippets for src/content/docs/guides/data_types/tree.mdx
//
// The region "app" is the sample application of the tutorial. It runs when
// vitest imports this file. The tests below check what it has built.

// #region app
// #region leaves
import { hip } from '@rljson/hash';
import type { Ref, Tree } from '@rljson/rljson';
// #endregion leaves
// #region table
import type { TreesTable } from '@rljson/rljson';
// #endregion table
// #region validate
import { BaseValidator, Validate } from '@rljson/rljson';
// #endregion validate
// #endregion app

// #region from-object
import { treeFromObject } from '@rljson/rljson';
// #endregion from-object

import { writeGolden } from '@tssuite/golden';
import { describe, expect, it, vi } from 'vitest';

// Record what the application prints
const log = vi.spyOn(console, 'log').mockImplementation(() => {});

// #region app
// #region leaves
/** A part of a car. Every part has a name */
type Part = { name: string };

/** Returns the reference to a node: the hash that hip wrote into it */
const ref = (node: object): Ref => (node as { _hash: Ref })._hash;

/** Creates a part. It references its sub parts by their hashes */
const part = (name: string, subParts: Tree[] = []) =>
  hip<Tree>({
    isParent: subParts.length > 0,
    meta: { name } satisfies Part,
    children: subParts.length > 0 ? subParts.map(ref) : null,
  });

// The leaves: parts without sub parts
const door = part('Door');
const roof = part('Roof');
const battery = part('Performance Battery');
const motor = part('Electric Motor');
// #endregion leaves

// #region parents
// The parents: parts that consist of sub parts
const body = part('Body', [door, roof]);
const drivetrain = part('Drivetrain', [battery, motor]);
const taycan = part('Taycan', [body, drivetrain]);
// #endregion parents

// #region table
// All parts of the car live in one trees table
const parts = hip<TreesTable>({
  _type: 'trees',
  _data: [taycan, body, drivetrain, door, roof, battery, motor],
});
// #endregion table

// #region validate
// BaseValidator checks that every sub part exists
const validate = new Validate();
validate.addValidator(new BaseValidator());

const errors = await validate.run({ parts });
if (Object.keys(errors).length > 0) {
  throw new Error(JSON.stringify(errors, null, 2));
}
// #endregion validate

// #region print
/** Prints a part and, indented below it, all of its sub parts */
const print = (table: TreesTable, hash: Ref, indent = '') => {
  const node = table._data.find((row) => ref(row) === hash)!;
  console.log(`${indent}${(node.meta as Part).name}`);

  for (const child of node.children ?? []) {
    print(table, child, indent + '  ');
  }
};

// Print the whole car, starting at the root
print(parts, ref(taycan));
// #endregion print

// #region change
// The Taycan gets a larger battery
const batteryPlus = part('Performance Battery Plus');
// A new sub part has a new hash, so every parent up to the root changes
const newDrivetrain = part('Drivetrain', [batteryPlus, motor]);
const newTaycan = part('Taycan', [body, newDrivetrain]);

// Add the new parts; the old ones stay as they are
const newParts = hip<TreesTable>({
  _type: 'trees',
  _data: [...parts._data, newTaycan, newDrivetrain, batteryPlus],
});

console.log('\nAfter the battery upgrade:');
print(newParts, ref(newTaycan));

// Only the changed path is new: the body is reused
const known = new Set(parts._data.map(ref));
const added = newParts._data.filter((node) => !known.has(ref(node)));
const names = added.map((node) => (node.meta as Part).name);
console.log(`\nNew parts: ${names.join(', ')}`);
// #endregion change
// #endregion app

const output = log.mock.calls.map((args) => args.join(' ')).join('\n');
log.mockRestore();

describe('Tree tutorial', () => {
  it('references the sub parts by their hashes', () => {
    expect(taycan.children).toEqual([ref(body), ref(drivetrain)]);
    expect(door.children).toBeNull();
  });

  it('stores the parts as rows of a trees table', async () => {
    await writeGolden('parts.json', parts);
  });

  it('validates the parts', async () => {
    expect(errors).toEqual({});
    expect(await validate.run({ parts: newParts })).toEqual({});
  });

  it('prints the parts and replaces the changed path only', async () => {
    await writeGolden('output.txt', output);

    expect(output).toBe(
      [
        'Taycan',
        '  Body',
        '    Door',
        '    Roof',
        '  Drivetrain',
        '    Performance Battery',
        '    Electric Motor',
        '\nAfter the battery upgrade:',
        'Taycan',
        '  Body',
        '    Door',
        '    Roof',
        '  Drivetrain',
        '    Performance Battery Plus',
        '    Electric Motor',
        '\nNew parts: Taycan, Drivetrain, Performance Battery Plus',
      ].join('\n'),
    );
  });

  it('builds a tree from a plain object', () => {
    // #region from-object
    const nodes = treeFromObject({
      taycan: {
        body: {
          door: { meta: { name: 'Door' } },
          roof: { meta: { name: 'Roof' } },
        },
        drivetrain: {
          battery: { meta: { name: 'Performance Battery' } },
          motor: { meta: { name: 'Electric Motor' } },
        },
      },
    });
    // #endregion from-object

    // 7 parts and a root on top
    expect(nodes).toHaveLength(parts._data.length + 1);
    const drivetrainNode = nodes.find((node) => node.id === 'drivetrain')!;
    expect(drivetrainNode.meta).toBeNull();
    expect(drivetrainNode.children).toHaveLength(2);
  });

  it('detects a missing sub part', async () => {
    // #region missing-child
    const incomplete = hip<TreesTable>({
      _type: 'trees',
      _data: [taycan, body, drivetrain, door, roof, battery],
    });

    const result = await validate.run({ parts: incomplete });
    // #endregion missing-child

    await writeGolden('missing-child.json', result);
    expect(result.base.treeChildNodesNotFound).toEqual({
      error: 'Child nodes are missing',
      brokenTrees: [
        {
          treesTable: 'parts',
          brokenTree: ref(drivetrain),
          missingChildNode: ref(motor),
        },
      ],
    });
  });

  it('detects a leaf with children', async () => {
    const leafWithChildren = hip<Tree>({
      isParent: false,
      meta: { name: 'Body' },
      children: [ref(door)],
    });

    const result = await validate.run({
      parts: hip<TreesTable>({
        _type: 'trees',
        _data: [leafWithChildren, door],
      }),
    });

    expect(result.base.treeIsNotParentButHasChildren).toBeDefined();
  });
});
