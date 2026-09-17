---
title: What is Rljson?
description: An introduction to the Rljson exchange format and the problem it solves.
---

Rljson is a JSON-based exchange format inspired by relational databases,
designed for the efficient synchronization of large datasets across networks.

It is built on four ideas that work together:

- **Relational** — data lives in normalized tables, not in deeply nested,
  duplicated object graphs.
- **Deeply hashed** — every object gets a content hash, added by
  [`@rljson/hash`](https://github.com/rljson/hash).
- **Immutable** — those hashes are the primary keys, so a row never changes;
  a new version is simply a new row with a new hash.
- **Decentralized** — hashes are computed locally, so no server is needed to
  assign identity to a piece of data.

## The problem it solves

Sending a large dataset over the network twice usually means sending most of
it twice. Rljson avoids that: because every row is identified by the hash of
its content, both sides can cheaply agree on what the other already has, and
transmit only the difference.

The same property makes caching, change detection and integrity checks fall
out of the format rather than having to be bolted on.

## A first look

An Rljson file is a collection of tables. The table name is the key, the
table data is the value:

```json
{
  "ingredients": {
    "_type": "components",
    "_data": [
      { "id": "flour", "amountUnit": "g", "_hash": "A5d..." },
      { "id": "sugar", "amountUnit": "g", "_hash": "B7f..." }
    ],
    "_hash": "t5o..."
  }
}
```

Each row carries a `_hash`, and so does the table itself. Change one value in
one row and only that row's hash — and the hashes above it — change.

## Where to go next

- [Getting started](/guides/getting-started/) — install the packages and
  write your first Rljson object.
- [Principles](/guides/principles/) — the design rules the format follows.
- [Data types](/guides/data-types/) — Components, SliceIds, Layers, Cakes,
  Buffets and Trees.
