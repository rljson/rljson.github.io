---
title: Ecosystem
description: The packages that make up the Rljson ecosystem.
---

`@rljson/rljson` is the foundational layer. The packages around it build
storage, transport, databases and tooling on top of the format.

## Core

| Package                                                  | Purpose                              |
| -------------------------------------------------------- | ------------------------------------ |
| [`@rljson/rljson`](https://github.com/rljson/rljson)     | Core types, validation and protocols |
| [`@rljson/hash`](https://github.com/rljson/hash)         | Deep hashing for Rljson data         |
| [`@rljson/json`](https://github.com/rljson/json)         | Basic JSON type definitions          |
| [`@rljson/validate`](https://github.com/rljson/validate) | Validate Rljson files                |

## Storage and transport

| Package                                                | Purpose                               |
| ------------------------------------------------------ | ------------------------------------- |
| [`@rljson/io`](https://github.com/rljson/io)           | Low level read and write interface    |
| [`@rljson/bs`](https://github.com/rljson/bs)           | Blob storage (`Bs`, `BsPeer`)         |
| [`@rljson/db`](https://github.com/rljson/db)           | High level database interface         |
| [`@rljson/server`](https://github.com/rljson/server)   | Local-first, pull-by-reference server |
| [`@rljson/network`](https://github.com/rljson/network) | Networking layer                      |

## Io implementations

| Package                                                              | Backend            |
| -------------------------------------------------------------------- | ------------------ |
| [`@rljson/io-fs`](https://github.com/rljson/io-fs)                   | File system        |
| [`@rljson/io-sqlite`](https://github.com/rljson/io-sqlite)           | SQLite             |
| [`@rljson/io-sqlite-node`](https://github.com/rljson/io-sqlite-node) | SQLite on Node     |
| [`@rljson/io-mssql`](https://github.com/rljson/io-mssql)             | Microsoft SQL      |
| [`@rljson/io-indexed-db`](https://github.com/rljson/io-indexed-db)   | Browser IndexedDB  |
| [`@rljson/io-client`](https://github.com/rljson/io-client)           | Client side        |
| [`@rljson/io-server`](https://github.com/rljson/io-server)           | Server side        |
| [`@rljson/bs-fs`](https://github.com/rljson/bs-fs)                   | Blob storage on fs |

## Agents and tooling

| Package                                                        | Purpose                             |
| -------------------------------------------------------------- | ----------------------------------- |
| [`@rljson/fs-agent`](https://github.com/rljson/fs-agent)       | File system ↔ database sync         |
| [`@rljson/mongo-agent`](https://github.com/rljson/mongo-agent) | MongoDB ↔ database sync             |
| [`@rljson/cli`](https://github.com/rljson/cli)                 | Command line interface              |
| [`@rljson/converter`](https://github.com/rljson/converter)     | Convert data into and out of Rljson |
| [`@rljson/generator`](https://github.com/rljson/generator)     | Code and data generation            |
| [`@rljson/is-ready`](https://github.com/rljson/is-ready)       | Readiness signalling                |

## User interface

| Package                                                          | Purpose                        |
| ---------------------------------------------------------------- | ------------------------------ |
| [`@rljson/uikit`](https://github.com/rljson/uikit)               | UI kit for browser apps        |
| [`@rljson/generator-ui`](https://github.com/rljson/generator-ui) | UI for the generator           |
| [`@rljson/icons`](https://github.com/rljson/icons)               | Icons and architecture figures |
