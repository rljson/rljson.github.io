// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

// Snippets for src/content/docs/guides/db/history.mdx
//
// The region "app" is the sample application of the tutorial. It runs when
// vitest imports this file. The tests below check what it has built.

// #region app
// #region setup
import { writeGolden } from '@tssuite/golden';
import { MultiEditManager } from '@rljson/db';
import type {
  EditColumnSelection,
  EditRowFilter,
  EditSetValue,
} from '@rljson/db';
import { hip } from '@rljson/hash';
import {
  createEditHistoryTableCfg,
  createEditTableCfg,
  createMultiEditTableCfg,
} from '@rljson/rljson';
import { carWorldDb, column } from './car-world-db';
// #endregion setup
// #endregion app

import { describe, expect, it } from 'vitest';

// #region app
// #region setup
const { db, catalogRef } = await carWorldDb();
await db.core.createTable(createEditTableCfg('catalogs'));
await db.core.createTable(createMultiEditTableCfg('catalogs'));
await db.core.createTable(createEditHistoryTableCfg('catalogs'));

// Four edits: select the columns, filter the rows, set the discount and
// set it again
const select = hip<EditColumnSelection>({
  name: 'Show model, price and discount',
  action: {
    name: 'Select',
    type: 'selection',
    data: {
      columns: [
        column('model', 'carBrands/brands/model'),
        column('price', 'carPrices/prices/amount', 'number'),
        column('discount', 'carPrices/prices/discountPercent', 'number'),
      ],
    },
    _hash: '',
  },
  _hash: '',
});

const filter = hip<EditRowFilter>({
  name: 'Price above 50000',
  action: {
    name: 'Filter',
    type: 'filter',
    data: {
      columnFilters: [
        {
          type: 'number',
          column: 'catalogs/carPrices/prices/amount',
          operator: 'greaterThan',
          search: 50000,
          _hash: '',
        },
      ],
      operator: 'and',
      _hash: '',
    },
    _hash: '',
  },
  _hash: '',
});

// A setValue edit for the discount column
const discount = (value: number) =>
  hip<EditSetValue>({
    name: `Give ${value} % discount`,
    action: {
      name: 'Set discount',
      type: 'setValue',
      data: {
        route: 'catalogs/carPrices/prices/discountPercent',
        value,
      },
      _hash: '',
    },
    _hash: '',
  });

const manager = new MultiEditManager('catalogs', db);
manager.init();
await manager.edit(select, catalogRef);
await manager.edit(filter);
await manager.edit(discount(10));

// A later setValue on the same cell replaces the earlier one
await manager.edit(discount(15));
const headRows = manager.join.rows;
await writeGolden('head.txt', manager.join.formatView());
// #endregion setup

// #region read
// Every edit added an edit history row
const histories = await db.getEditHistories('catalogs', {});
const historyOf = (ref: string) => histories.find((h) => h._hash === ref)!;

// Start at the head and follow previous back to the first edit. A history
// row points to a multi edit, the multi edit to its edit.
const steps: string[] = [];
const names: string[] = [];
let ref: string | undefined = manager.head!.editHistoryRef;
while (ref) {
  const history = historyOf(ref);
  const [multiEdit] = await db.getMultiEdits('catalogs', history.multiEditRef);
  const [edit] = await db.getEdits('catalogs', multiEdit.edit);
  names.push(edit.name);
  steps.unshift(ref);
  ref = history.previous?.[0];
}
const [selected, filtered, discounted, head] = steps;
await writeGolden('steps.txt', names.join('\n'));
// #endregion read

// #region undo
// A manager opened on the stored history builds the view of any step
const browser = new MultiEditManager('catalogs', db);

await browser.editHistoryRef(filtered);
await writeGolden('undo.txt', browser.join.formatView());
// #endregion undo

// #region redo
const redo: string[] = [];
await browser.editHistoryRef(discounted);
redo.push('Forward to 10 %:', browser.join.formatView());

await browser.editHistoryRef(head);
redo.push('\nForward to 15 %:', browser.join.formatView());

await browser.editHistoryRef(selected);
redo.push('\nBack to the selection:', browser.join.formatView());
await writeGolden('redo.txt', redo.join('\n'));
// #endregion redo

// #region branch
// Go back to the filter and edit from there. The new edit builds on the
// filter; the edits after it stay in the history.
await browser.editHistoryRef(filtered);
await browser.edit(discount(5));

const branch = (await db.getEditHistories('catalogs', {})).find(
  (h) => h._hash === browser.head!.editHistoryRef,
)!;
await writeGolden(
  'branch.txt',
  `${browser.join.formatView()}\n\n` +
    `Builds on the filter: ${branch.previous?.[0] === filtered}`,
);
// #endregion branch
// #endregion app

describe('History tutorial', () => {
  it('stores one history row per edit', () => {
    expect(histories).toHaveLength(4);
  });

  it('replaces the earlier value of a cell', () => {
    expect(headRows.every((row) => row[2][0] === 15)).toBe(true);
  });

  it('edits after going back', () => {
    expect(branch.previous?.[0]).toBe(filtered);
    const rows = browser.join.rows;
    expect(rows).toHaveLength(3);
    expect(rows.every((row) => row[2][0] === 5)).toBe(true);
  });

  it('reads the edits from the head back', () => {
    expect(names[0]).toBe('Give 15 % discount');
  });
});
