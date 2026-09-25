// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

// Snippets for src/content/docs/guides/data_types/layers.mdx
//
// The region "app" is the sample application of the tutorial. It runs when
// vitest imports this file. The tests below check what it has built.

// #region app
// #region amounts
import { hip } from '@rljson/hash';
import type { ComponentsTable, Ref } from '@rljson/rljson';
// #endregion amounts
// #region slice-ids
import type { SliceIds } from '@rljson/rljson';
// #endregion slice-ids
// #region layer
import type { Layer } from '@rljson/rljson';
// #endregion layer
// #region tables
import type { LayersTable, Rljson, SliceIdsTable } from '@rljson/rljson';
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
// #region amounts
type Amount = { quantity: number; unit: 'g' | 'ml' };

const amounts = hip<ComponentsTable<Amount>>({
  _type: 'components',
  _data: [
    { quantity: 250, unit: 'g' },
    { quantity: 200, unit: 'g' },
    { quantity: 200, unit: 'ml' },
  ],
});

/** Returns the reference to a row: the hash that hip wrote into it */
const ref = (row: object): Ref => (row as { _hash: Ref })._hash;

const [g250, g200, ml200] = amounts._data;
// #endregion amounts

// #region slice-ids
const spongeIngredients = hip<SliceIds>({ add: ['flour', 'sugar', 'milk'] });
// #endregion slice-ids

// #region layer
const sponge = hip<Layer>({
  id: 'sponge',
  sliceIdsTable: 'ingredientTypes',
  sliceIdsTableRow: ref(spongeIngredients),
  componentsTable: 'amounts',
  add: { flour: ref(g250), sugar: ref(g200), milk: ref(ml200) },
});
// #endregion layer

// #region variants
// A butter cake: the sponge plus butter
const butterIngredients = hip<SliceIds>({
  base: ref(spongeIngredients),
  add: ['butter'],
});

const butterCake = hip<Layer>({
  id: 'butterCake',
  base: ref(sponge),
  sliceIdsTable: 'ingredientTypes',
  sliceIdsTableRow: ref(butterIngredients),
  componentsTable: 'amounts',
  add: { butter: ref(g200) },
});

// A gluten-free sponge: ground almonds instead of flour
const glutenFreeIngredients = hip<SliceIds>({
  base: ref(spongeIngredients),
  add: ['almonds'],
  remove: ['flour'],
});

const glutenFree = hip<Layer>({
  id: 'glutenFree',
  base: ref(sponge),
  sliceIdsTable: 'ingredientTypes',
  sliceIdsTableRow: ref(glutenFreeIngredients),
  componentsTable: 'amounts',
  add: { almonds: ref(g250) },
  remove: { flour: ref(g250) },
});
// #endregion variants

// #region tables
const ingredientTypes = hip<SliceIdsTable>({
  _type: 'sliceIds',
  _data: [spongeIngredients, butterIngredients, glutenFreeIngredients],
});

const recipes = hip<LayersTable>({
  _type: 'layers',
  _data: [sponge, butterCake, glutenFree],
});

const recipeBook: Rljson = { amounts, ingredientTypes, recipes };
// #endregion tables

// #region validate
const validate = new Validate();
validate.addValidator(new BaseValidator());

const errors = await validate.run(recipeBook);
if (Object.keys(errors).length > 0) {
  throw new Error(JSON.stringify(errors, null, 2));
}
// #endregion validate

// #region resolve
/** Follows a reference: finds the row with the given hash */
const rowOf = <T extends object>(table: { _data: T[] }, hash: Ref): T =>
  table._data.find((row) => ref(row) === hash)!;

/** Returns the assignments of a layer, merged with those of its base */
const assignmentsOf = (layer: Layer): Record<string, Ref> => {
  const base = layer.base ? assignmentsOf(rowOf(recipes, layer.base)) : {};
  const assignments = { ...base, ...layer.add };

  for (const sliceId of Object.keys(layer.remove ?? {})) {
    delete assignments[sliceId];
  }

  delete assignments._hash; // hip has hashed the add object, too
  return assignments;
};

for (const recipe of recipes._data) {
  const lines = Object.entries(assignmentsOf(recipe)).map(
    ([ingredient, amountRef]) => {
      const { quantity, unit } = rowOf(amounts, amountRef);
      return `${quantity} ${unit} ${ingredient}`;
    },
  );

  console.log(`${recipe.id}: ${lines.join(', ')}`);
}
// #endregion resolve
// #endregion app

const output = log.mock.calls.map((args) => args.join(' ')).join('\n');
log.mockRestore();

describe('Layers tutorial', () => {
  it('stores each amount once', () => {
    expect(amounts._data).toHaveLength(3);
    expect(butterCake.add.butter).toBe(sponge.add.sugar); // both 200 g
    expect(glutenFree.add.almonds).toBe(sponge.add.flour); // both 250 g
  });

  it('derives slice ids from a base', async () => {
    await writeGolden('ingredient-types.json', ingredientTypes);

    expect(butterIngredients.base).toBe(ref(spongeIngredients));
    expect(glutenFreeIngredients.remove).toEqual(['flour']);
  });

  it('assigns components to slice ids', async () => {
    await writeGolden('recipes.json', recipes);

    expect(Object.keys(sponge.add)).toEqual([
      'flour',
      'sugar',
      'milk',
      '_hash',
    ]);
  });

  it('validates the recipe book', () => {
    expect(errors).toEqual({});
  });

  it('resolves the ingredients of each recipe', async () => {
    await writeGolden('output.txt', output);

    expect(output).toBe(
      [
        'sponge: 250 g flour, 200 g sugar, 200 ml milk',
        'butterCake: 250 g flour, 200 g sugar, 200 ml milk, 200 g butter',
        'glutenFree: 200 g sugar, 200 ml milk, 250 g almonds',
      ].join('\n'),
    );
  });

  it('detects a slice id without a component', async () => {
    // #region missing-assignment
    const forgetful = hip<Layer>({
      id: 'butterCake',
      base: ref(sponge),
      sliceIdsTable: 'ingredientTypes',
      sliceIdsTableRow: ref(butterIngredients),
      componentsTable: 'amounts',
      add: {}, // no amount for butter
    });

    const result = await validate.run({
      ...recipeBook,
      recipes: hip<LayersTable>({
        _type: 'layers',
        _data: [sponge, forgetful],
      }),
    });
    // #endregion missing-assignment

    await writeGolden('missing-assignment.json', result);
    expect(result.base.layerAssignmentsDoNotMatchSliceIds).toEqual({
      error: 'Layers have missing assignments',
      layers: [
        {
          brokenLayer: ref(forgetful),
          layersTable: 'recipes',
          unassignedSliceIds: ['butter'],
        },
      ],
    });
  });
});
