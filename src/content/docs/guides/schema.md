---
title: Schema and validation
description: TableCfg, column definitions and the validator system.
---

## TableCfg

`TableCfg` defines the schema of a table: its key, content type, column
definitions and metadata flags.

```typescript
import { ColumnCfg, TableCfg, throwOnInvalidTableCfg } from '@rljson/rljson';

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
```

Column types are `string`, `number`, `boolean`, `json` and `jsonArray`.
A column can point at another table through the `ref` property of
`ColumnCfgWithRef`.

## Validation

The `Validate` class coordinates several validators to check a whole Rljson
object: naming conventions, hash integrity, reference validity, tree
structure, and layer, cake and buffet consistency.

```typescript
import { BaseValidator, Validate } from '@rljson/rljson';

const validate = new Validate();
validate.addValidator(new BaseValidator());

const errors = await validate.run(myRljsonData);
// { base: { hasErrors: false } }
```

`BaseValidator` checks all core rules. Add project-specific rules by
implementing the `Validator` interface and registering it with
`addValidator`.
