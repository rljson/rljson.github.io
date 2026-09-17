---
title: Principles
description: The design principles behind the Rljson format.
---

Rljson follows a small set of principles. Together they explain most of the
design decisions in the format.

## JSON

Rljson uses plain JSON as its base format. Anything that can read JSON can
read Rljson; the structure is a convention on top, not a new encoding.

## Relational

Data is organized into tables, much like a relational database. This lets
Rljson data be imported into existing database systems without translation.

## Normalized

Rljson transmits normalized, redundancy-free data that is joined on the
client side. A component referenced by a thousand slices is transmitted once.

## Deeply hashed

Hashes are added to all data using [`@rljson/hash`](https://github.com/rljson/hash).
The hash is computed recursively, so a nested object's hash depends on
everything it contains.

## Immutable

Hashes serve as primary keys, which makes datasets immutable by default. A row
is never edited in place — a change produces a new row with a new hash, and
the old one remains valid.

## Comparable

Because identity is derived from content, comparing two datasets is a
comparison of hashes rather than a deep walk of the data.

## Database-oriented

Since Rljson follows a database-oriented structure, importing and exporting to
and from databases is streamlined. The [`@rljson/io-*`](/reference/ecosystem/)
packages implement this for SQLite, MSSQL, the file system and IndexedDB.

## Decentralized

Rljson hashes can be created without a server, which makes the format
well-suited for local-first and Web 3.0 applications.
