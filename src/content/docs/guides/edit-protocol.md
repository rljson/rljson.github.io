---
title: Edit protocol
description: Inserts, InsertHistory, Edits, MultiEdits and EditHistory.
---

Rljson data is immutable, so a change is expressed as an operation rather
than as an in-place edit.

## Insert

An `Insert` describes a data modification: a command, a value, a route and an
optional origin.

```typescript
import { Insert, validateInsert } from '@rljson/rljson';

const insert: Insert<any> = {
  route: '/ingredients',
  command: 'add',
  value: { name: 'butter', amountUnit: 'g' },
};

const errors = validateInsert(insert);
```

## InsertHistory

`InsertHistoryRow` records each insert with a unique `timeId`, the `route`
that was modified, and optionally its `origin`, its causal predecessors
(`previous`) and a `clientTimestamp`.

```typescript
import { InsertHistoryRow, InsertHistoryTimeId } from '@rljson/rljson';

const row: InsertHistoryRow<'ingredients'> = {
  ingredientsRef: 'A5d...',
  timeId: '1700000000000:AbCd',
  route: '/ingredients',
  origin: 'client_ExAmPlE12345',
  previous: ['1699999999999:ZzZz'],
  clientTimestamp: 1700000000000,
};
```

Because each row names its predecessors, the history forms a DAG rather than
a straight line — which is what makes concurrent writes from several clients
detectable.

## Edits, MultiEdits and EditHistory

- **Edit** — a named action with a type and a data payload (`EditAction`).
- **MultiEdit** — chains edits into a linked list through a `previous`
  reference.
- **EditHistory** — tracks the full chain of multi-edits with `timeId`
  timestamps.

## TimeId

A `timeId` is a unique, time-based identifier of the form
`"timestamp:xxxx"`:

```typescript
import { getTimeIdTimestamp, isTimeId, timeId } from '@rljson/rljson';

const id = timeId(); // '1700000000000:AbCd'
isTimeId(id); // true
getTimeIdTimestamp(id); // 1700000000000
```
