// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

// Snippets for src/content/docs/guides/data_types/components.mdx
//
// The region "app" is the sample application of the tutorial. It runs when
// vitest imports this file. The tests below check what it has built.

// #region app
// #region types
import type { Ref } from '@rljson/rljson';
// #endregion types
// #region nutritional-values
import { hip } from '@rljson/hash';
import type { ComponentsTable } from '@rljson/rljson';
// #endregion nutritional-values
// #region validate
import { BaseValidator, type Rljson, Validate } from '@rljson/rljson';
// #endregion validate
// #endregion app

import { writeGolden } from '@tssuite/golden';
import { describe, expect, it, vi } from 'vitest';

// Record what the application prints
const log = vi.spyOn(console, 'log').mockImplementation(() => {});

// #region app
// #region types
/** Nutritional values per 100 g */
type NutritionalValues = {
  id: string;
  energy: number; // kcal
  fat: number; // g
  protein: number; // g
  carbohydrates: number; // g
};

type Ingredient = {
  id: string;
  amountUnit: 'g' | 'ml';
  nutritionalValuesRef: Ref;
};

type RecipeIngredient = {
  ingredientsRef: Ref;
  quantity: number;
};
// #endregion types

// #region nutritional-values
const nutritionalValues = hip<ComponentsTable<NutritionalValues>>({
  _type: 'components',
  _data: [
    {
      id: 'flour',
      energy: 364,
      fat: 0.98,
      protein: 10.33,
      carbohydrates: 76.31,
    },
    { id: 'sugar', energy: 387, fat: 0, protein: 0, carbohydrates: 100 },
  ],
});

/** Returns the reference to a row: the hash that hip wrote into it */
const ref = (row: object): Ref => (row as { _hash: Ref })._hash;

const [flourValues, sugarValues] = nutritionalValues._data;
// #endregion nutritional-values

// #region ingredients
const ingredients = hip<ComponentsTable<Ingredient>>({
  _type: 'components',
  _data: [
    { id: 'flour', amountUnit: 'g', nutritionalValuesRef: ref(flourValues) },
    { id: 'sugar', amountUnit: 'g', nutritionalValuesRef: ref(sugarValues) },
  ],
});
// #endregion ingredients

// #region recipe
const [flour, sugar] = ingredients._data;

const recipeIngredients = hip<ComponentsTable<RecipeIngredient>>({
  _type: 'components',
  _data: [
    { ingredientsRef: ref(flour), quantity: 500 },
    { ingredientsRef: ref(sugar), quantity: 200 },
  ],
});
// #endregion recipe

// #region validate
const bakery: Rljson = { nutritionalValues, ingredients, recipeIngredients };

const validate = new Validate();
validate.addValidator(new BaseValidator());

const errors = await validate.run(bakery);
if (Object.keys(errors).length > 0) {
  throw new Error(JSON.stringify(errors, null, 2));
}
// #endregion validate

// #region calculate
/** Follows a reference: finds the row with the given hash */
const rowOf = <T extends object>(table: { _data: T[] }, hash: Ref): T =>
  table._data.find((row) => ref(row) === hash)!;

let total = 0;
for (const item of recipeIngredients._data) {
  const ingredient = rowOf(ingredients, item.ingredientsRef);
  const values = rowOf(nutritionalValues, ingredient.nutritionalValuesRef);
  const energy = (values.energy * item.quantity) / 100;
  total += energy;

  console.log(
    `${item.quantity} ${ingredient.amountUnit} ${ingredient.id}: ${energy} kcal`,
  );
}
console.log(`Total: ${total} kcal`);
// #endregion calculate
// #endregion app

const output = log.mock.calls.map((args) => args.join(' ')).join('\n');
log.mockRestore();

describe('Components tutorial', () => {
  it('hashes each row and the table', async () => {
    await writeGolden('nutritional-values.json', nutritionalValues);

    const hashes = nutritionalValues._data.map(ref);
    expect(hashes.every((hash) => typeof hash === 'string')).toBe(true);
    expect(ref(nutritionalValues)).toBeTypeOf('string');
  });

  it('gives equal content an equal hash', () => {
    // #region same-content
    const flourAgain = hip<NutritionalValues>({
      carbohydrates: 76.31,
      energy: 364,
      fat: 0.98,
      id: 'flour',
      protein: 10.33,
    });

    expect(ref(flourAgain)).toBe(ref(flourValues)); // same content, same hash
    // #endregion same-content
  });

  it('references rows by their hash', async () => {
    await writeGolden('ingredients.json', ingredients);

    expect(flour.nutritionalValuesRef).toBe(ref(flourValues));
    expect(recipeIngredients._data[0].ingredientsRef).toBe(ref(flour));
  });

  it('validates the bakery', () => {
    expect(errors).toEqual({});
    expect(new BaseValidator().validateSync(bakery)).toEqual({
      hasErrors: false,
    });
  });

  it('calculates the energy of the recipe', async () => {
    await writeGolden('output.txt', output);

    expect(output).toBe(
      [
        '500 g flour: 1820 kcal',
        '200 g sugar: 774 kcal',
        'Total: 2594 kcal',
      ].join('\n'),
    );
  });

  it('detects a row that was changed in place', async () => {
    // #region changed-in-place
    const changed = structuredClone(bakery);
    changed.nutritionalValues._data[0].energy = 400; // the hash stays the same

    const result = await validate.run(changed);
    // #endregion changed-in-place

    await writeGolden('changed-in-place.json', result);
    expect(result.base.hashesNotValid).toBeDefined();
  });

  it('does not check references without a TableCfg', async () => {
    const brokenRef = structuredClone(bakery);
    brokenRef.ingredients._data[0].nutritionalValuesRef = 'MISSING';
    hip(brokenRef, { updateExistingHashes: true, throwOnWrongHashes: false });

    expect(await validate.run(brokenRef)).toEqual({});
  });
});
