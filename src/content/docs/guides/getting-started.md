---
title: Getting started
description: Install the Rljson packages and create your first hashed dataset.
---

## Installation

The core types, validation rules and protocol definitions live in
`@rljson/rljson`:

```bash
pnpm add @rljson/rljson
```

Most projects also want the hashing package:

```bash
pnpm add @rljson/hash
```

## Import what you need

```typescript
import {
  ConnectorPayload,
  Rljson,
  Route,
  SyncConfig,
  timeId,
} from '@rljson/rljson';
```

## Create a table

A table declares its `_type` and holds its rows in `_data`. Hashes are added
for you:

```typescript
import { ComponentsTable } from '@rljson/rljson';

const ingredients: ComponentsTable = {
  _type: 'components',
  _data: [
    { id: 'flour', amountUnit: 'g', _hash: 'A5d...' },
    { id: 'sugar', amountUnit: 'g', _hash: 'B7f...' },
  ],
  _hash: 't5o...',
};
```

## Validate it

`Validate` runs a set of validators over a whole Rljson object — naming
conventions, hash integrity, reference validity and structural consistency:

```typescript
import { BaseValidator, Validate } from '@rljson/rljson';

const validate = new Validate();
validate.addValidator(new BaseValidator());

const errors = await validate.run(myRljsonData);
// { base: { hasErrors: false } }
```

`BaseValidator` covers the core rules. Add your own by implementing the
`Validator` interface.

## Next steps

- [Tables, rows and hashes](/guides/tables/) — how a table is put together.
- [Data types](/guides/data-types/) — the six content types Rljson defines.
- [Ecosystem](/reference/ecosystem/) — the packages around the core.
