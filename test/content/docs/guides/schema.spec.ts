// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

// Snippets for src/content/docs/guides/schema.mdx

// #region table-cfg
import { type TableCfg, throwOnInvalidTableCfg } from '@rljson/rljson';
// #endregion table-cfg

// #region validation
import { hip } from '@rljson/hash';
import { BaseValidator, Validate } from '@rljson/rljson';
// #endregion validation

import { describe, expect, it } from 'vitest';

describe('Schema and validation', () => {
  it('TableCfg: defines the schema of a table', () => {
    // #region table-cfg
    const cfg: TableCfg = {
      key: 'ingredients',
      type: 'components',
      columns: [
        { key: '_hash', type: 'string', titleLong: 'Hash', titleShort: 'Hash' },
        { key: 'name', type: 'string', titleLong: 'Name', titleShort: 'Name' },
      ],
      isHead: false,
      isRoot: false,
      isShared: false,
    };

    throwOnInvalidTableCfg(cfg); // throws on an invalid config
    // #endregion table-cfg

    expect(() => throwOnInvalidTableCfg({ ...cfg, columns: [] })).toThrow(
      'Table "ingredients" must have at least a _hash and a second column',
    );
  });

  it('Validation: reports the errors of each validator', async () => {
    // #region validation
    const validate = new Validate();
    validate.addValidator(new BaseValidator());

    const errors = await validate.run({
      'my-table': hip({ _type: 'components', _data: [{ name: 'flour' }] }),
    });
    // #endregion validation

    await expect(JSON.stringify(errors, null, 2)).toMatchFileSnapshot(
      '../../../goldens/guides/schema/validation.json',
    );
  });
});
