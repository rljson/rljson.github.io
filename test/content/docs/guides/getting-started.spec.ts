// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

// Snippets for src/content/docs/guides/getting-started.mdx

import { writeGolden } from '@tssuite/golden';

// #region imports
import {
  type ConnectorPayload,
  type Rljson,
  Route,
  type SyncConfig,
  timeId,
} from '@rljson/rljson';
// #endregion imports

// #region create-table
import { hip } from '@rljson/hash';
import type { ComponentsTable } from '@rljson/rljson';
// #endregion create-table

// #region validate
import { BaseValidator, Validate } from '@rljson/rljson';
// #endregion validate

import { isTimeId } from '@rljson/rljson';
import { describe, expect, it } from 'vitest';

describe('Getting started', () => {
  it('Import what you need: provides types and functions', () => {
    const payload: ConnectorPayload = { o: timeId(), r: timeId() };
    const config: SyncConfig = { requireAck: true };
    const rljson: Rljson = {};

    expect(isTimeId(payload.r)).toBe(true);
    expect(Route.fromFlat('/ingredients').root).toEqual({
      tableKey: 'ingredients',
    });
    expect({ config, rljson }).toEqual({
      config: { requireAck: true },
      rljson: {},
    });
  });

  it('Create a table and validate it', async () => {
    // #region create-table
    type Ingredient = { id: string; amountUnit: string };

    const ingredients: ComponentsTable<Ingredient> = hip({
      _type: 'components',
      _data: [
        { id: 'flour', amountUnit: 'g' },
        { id: 'sugar', amountUnit: 'g' },
      ],
    });
    // #endregion create-table

    await writeGolden('create-table.json', ingredients);

    // #region validate
    const validate = new Validate();
    validate.addValidator(new BaseValidator());

    const errors = await validate.run({ ingredients });

    expect(errors).toEqual({}); // no validator found an error
    // #endregion validate
  });
});
