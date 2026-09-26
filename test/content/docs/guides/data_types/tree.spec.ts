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
// #region models
import { hip } from '@rljson/hash';
import type { Ref, Tree } from '@rljson/rljson';
// #endregion models
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
// #region models
/** Returns the reference to a node: the hash that hip wrote into it */
const ref = (node: object): Ref => (node as { _hash: Ref })._hash;

/** Creates a leaf: a car model and its price in euros */
const model = (id: string, price: number) =>
  hip<Tree>({ id, isParent: false, meta: { price }, children: null });

// The leaves: the car models
const taycan = model('taycan', 101000);
const macan = model('macan', 84000);
const ex30 = model('ex30', 36000);
const ex90 = model('ex90', 82000);
// #endregion models

// #region manufacturers
/** Creates a parent that references its children by their hashes */
const manufacturer = (id: string, children: Tree[]) =>
  hip<Tree>({ id, isParent: true, meta: null, children: children.map(ref) });

// The parents: the manufacturers, and a root above them
const porsche = manufacturer('porsche', [taycan, macan]);
const volvo = manufacturer('volvo', [ex30, ex90]);
const root = manufacturer('root', [porsche, volvo]);
// #endregion manufacturers

// #region table
// All nodes of the tree live in one trees table
const priceList = hip<TreesTable>({
  _type: 'trees',
  _data: [root, porsche, volvo, taycan, macan, ex30, ex90],
});
// #endregion table

// #region validate
// BaseValidator checks that every child exists
const validate = new Validate();
validate.addValidator(new BaseValidator());

const errors = await validate.run({ priceList });
if (Object.keys(errors).length > 0) {
  throw new Error(JSON.stringify(errors, null, 2));
}
// #endregion validate

// #region print
/** Prints a node and, indented below it, all of its descendants */
const print = (table: TreesTable, hash: Ref, indent = '') => {
  const node = table._data.find((row) => ref(row) === hash)!;
  const price = node.meta
    ? ` ${(node.meta.price as number).toLocaleString('en-US')} €`
    : '';
  console.log(`${indent}${node.id}${price}`);

  for (const child of node.children ?? []) {
    print(table, child, indent + '  ');
  }
};

// Print the whole tree, starting at the root
print(priceList, ref(root));
// #endregion print

// #region change
// The Taycan gets cheaper
const cheaperTaycan = model('taycan', 97000);
// A new child has a new hash, so every parent up to the root changes
const newPorsche = manufacturer('porsche', [cheaperTaycan, macan]);
const newRoot = manufacturer('root', [newPorsche, volvo]);

// Add the new nodes; the old ones stay as they are
const newPriceList = hip<TreesTable>({
  _type: 'trees',
  _data: [...priceList._data, newRoot, newPorsche, cheaperTaycan],
});

console.log('\nAfter the price change:');
print(newPriceList, ref(newRoot));

// Only the changed path is new: the Volvo branch is reused
const known = new Set(priceList._data.map(ref));
const added = newPriceList._data.filter((node) => !known.has(ref(node)));
console.log(`\nNew nodes: ${added.map((node) => node.id).join(', ')}`);
// #endregion change
// #endregion app

const output = log.mock.calls.map((args) => args.join(' ')).join('\n');
log.mockRestore();

describe('Tree tutorial', () => {
  it('references the children by their hashes', () => {
    expect(root.children).toEqual([ref(porsche), ref(volvo)]);
    expect(taycan.children).toBeNull();
  });

  it('stores the nodes as rows of a trees table', async () => {
    await writeGolden('price-list.json', priceList);
  });

  it('validates the price list', async () => {
    expect(errors).toEqual({});
    expect(await validate.run({ priceList: newPriceList })).toEqual({});
  });

  it('prints the price list and replaces the changed path only', async () => {
    await writeGolden('output.txt', output);

    expect(output).toBe(
      [
        'root',
        '  porsche',
        '    taycan 101,000 €',
        '    macan 84,000 €',
        '  volvo',
        '    ex30 36,000 €',
        '    ex90 82,000 €',
        '\nAfter the price change:',
        'root',
        '  porsche',
        '    taycan 97,000 €',
        '    macan 84,000 €',
        '  volvo',
        '    ex30 36,000 €',
        '    ex90 82,000 €',
        '\nNew nodes: root, porsche, taycan',
      ].join('\n'),
    );
  });

  it('builds the same tree from a plain object', () => {
    // #region from-object
    const nodes = treeFromObject({
      porsche: {
        taycan: { meta: { price: 101000 } },
        macan: { meta: { price: 84000 } },
      },
      volvo: {
        ex30: { meta: { price: 36000 } },
        ex90: { meta: { price: 82000 } },
      },
    });

    const rootNode = nodes.find((node) => node.id === 'root')!;
    expect(rootNode._hash).toBe(ref(root)); // same tree, same root hash
    // #endregion from-object

    expect(nodes).toHaveLength(priceList._data.length);
  });

  it('detects a missing child', async () => {
    // #region missing-child
    const incomplete = hip<TreesTable>({
      _type: 'trees',
      _data: [root, porsche, volvo, taycan, macan, ex30],
    });

    const result = await validate.run({ priceList: incomplete });
    // #endregion missing-child

    await writeGolden('missing-child.json', result);
    expect(result.base.treeChildNodesNotFound).toEqual({
      error: 'Child nodes are missing',
      brokenTrees: [
        {
          treesTable: 'priceList',
          brokenTree: ref(volvo),
          missingChildNode: ref(ex90),
        },
      ],
    });
  });

  it('detects a leaf with children', async () => {
    const leafWithChildren = hip<Tree>({
      id: 'porsche',
      isParent: false,
      meta: null,
      children: [ref(taycan)],
    });

    const result = await validate.run({
      priceList: hip<TreesTable>({
        _type: 'trees',
        _data: [leafWithChildren, taycan],
      }),
    });

    expect(result.base.treeIsNotParentButHasChildren).toBeDefined();
  });
});
