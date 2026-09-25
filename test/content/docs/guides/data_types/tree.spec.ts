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
// #region products
import { hip } from '@rljson/hash';
import type { Ref, Tree } from '@rljson/rljson';
// #endregion products
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
// #region products
/** Returns the reference to a node: the hash that hip wrote into it */
const ref = (node: object): Ref => (node as { _hash: Ref })._hash;

/** Creates a leaf: a product and its price */
const product = (id: string, price: number) =>
  hip<Tree>({ id, isParent: false, meta: { price }, children: null });

const cheesecake = product('cheesecake', 4.2);
const carrotCake = product('carrotCake', 3.8);
const sourdough = product('sourdough', 5.5);
const baguette = product('baguette', 2.5);
// #endregion products

// #region categories
/** Creates a parent that references its children by their hashes */
const category = (id: string, children: Tree[]) =>
  hip<Tree>({ id, isParent: true, meta: null, children: children.map(ref) });

const cakes = category('cakes', [cheesecake, carrotCake]);
const breads = category('breads', [sourdough, baguette]);
const root = category('root', [cakes, breads]);
// #endregion categories

// #region table
const menu = hip<TreesTable>({
  _type: 'trees',
  _data: [root, cakes, breads, cheesecake, carrotCake, sourdough, baguette],
});
// #endregion table

// #region validate
const validate = new Validate();
validate.addValidator(new BaseValidator());

const errors = await validate.run({ menu });
if (Object.keys(errors).length > 0) {
  throw new Error(JSON.stringify(errors, null, 2));
}
// #endregion validate

// #region print
/** Prints a node and, indented below it, all of its descendants */
const print = (table: TreesTable, hash: Ref, indent = '') => {
  const node = table._data.find((row) => ref(row) === hash)!;
  const price = node.meta ? ` ${(node.meta.price as number).toFixed(2)} €` : '';
  console.log(`${indent}${node.id}${price}`);

  for (const child of node.children ?? []) {
    print(table, child, indent + '  ');
  }
};

print(menu, ref(root));
// #endregion print

// #region change
// The cheesecake gets cheaper
const cheaperCheesecake = product('cheesecake', 3.9);
const newCakes = category('cakes', [cheaperCheesecake, carrotCake]);
const newRoot = category('root', [newCakes, breads]);

const newMenu = hip<TreesTable>({
  _type: 'trees',
  _data: [...menu._data, newRoot, newCakes, cheaperCheesecake],
});

console.log('\nAfter the price change:');
print(newMenu, ref(newRoot));

const known = new Set(menu._data.map(ref));
const added = newMenu._data.filter((node) => !known.has(ref(node)));
console.log(`\nNew nodes: ${added.map((node) => node.id).join(', ')}`);
// #endregion change
// #endregion app

const output = log.mock.calls.map((args) => args.join(' ')).join('\n');
log.mockRestore();

describe('Tree tutorial', () => {
  it('references the children by their hashes', () => {
    expect(root.children).toEqual([ref(cakes), ref(breads)]);
    expect(cheesecake.children).toBeNull();
  });

  it('stores the nodes as rows of a trees table', async () => {
    await writeGolden('menu.json', menu);
  });

  it('validates the menu', async () => {
    expect(errors).toEqual({});
    expect(await validate.run({ menu: newMenu })).toEqual({});
  });

  it('prints the menu and replaces the changed path only', async () => {
    await writeGolden('output.txt', output);

    expect(output).toBe(
      [
        'root',
        '  cakes',
        '    cheesecake 4.20 €',
        '    carrotCake 3.80 €',
        '  breads',
        '    sourdough 5.50 €',
        '    baguette 2.50 €',
        '\nAfter the price change:',
        'root',
        '  cakes',
        '    cheesecake 3.90 €',
        '    carrotCake 3.80 €',
        '  breads',
        '    sourdough 5.50 €',
        '    baguette 2.50 €',
        '\nNew nodes: root, cakes, cheesecake',
      ].join('\n'),
    );
  });

  it('builds the same tree from a plain object', () => {
    // #region from-object
    const nodes = treeFromObject({
      cakes: {
        cheesecake: { meta: { price: 4.2 } },
        carrotCake: { meta: { price: 3.8 } },
      },
      breads: {
        sourdough: { meta: { price: 5.5 } },
        baguette: { meta: { price: 2.5 } },
      },
    });

    const rootNode = nodes.find((node) => node.id === 'root')!;
    expect(rootNode._hash).toBe(ref(root)); // same tree, same root hash
    // #endregion from-object

    expect(nodes).toHaveLength(menu._data.length);
  });

  it('detects a missing child', async () => {
    // #region missing-child
    const incomplete = hip<TreesTable>({
      _type: 'trees',
      _data: [root, cakes, breads, cheesecake, carrotCake, sourdough],
    });

    const result = await validate.run({ menu: incomplete });
    // #endregion missing-child

    await writeGolden('missing-child.json', result);
    expect(result.base.treeChildNodesNotFound).toEqual({
      error: 'Child nodes are missing',
      brokenTrees: [
        {
          treesTable: 'menu',
          brokenTree: ref(breads),
          missingChildNode: ref(baguette),
        },
      ],
    });
  });

  it('detects a leaf with children', async () => {
    const leafWithChildren = hip<Tree>({
      id: 'cakes',
      isParent: false,
      meta: null,
      children: [ref(cheesecake)],
    });

    const result = await validate.run({
      menu: hip<TreesTable>({
        _type: 'trees',
        _data: [leafWithChildren, cheesecake],
      }),
    });

    expect(result.base.treeIsNotParentButHasChildren).toBeDefined();
  });
});
