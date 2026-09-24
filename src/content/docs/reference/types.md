---
title: Type reference
description: A quick index of the exported types of @rljson/rljson.
---

A short index of what `@rljson/rljson` exports, and where each type is
explained.

## Data model

| Type                                   | Guide                             |
| -------------------------------------- | --------------------------------- |
| `ComponentsTable`                      | [Data types](/guides/data-types/) |
| `SliceIds`, `SliceIdsTable`            | [Data types](/guides/data-types/) |
| `Layer`, `LayersTable`                 | [Data types](/guides/data-types/) |
| `Cake`, `CakesTable`                   | [Data types](/guides/data-types/) |
| `Buffet`, `BuffetsTable`               | [Data types](/guides/data-types/) |
| `Tree`, `TreesTable`, `treeFromObject` | [Data types](/guides/data-types/) |

## Schema

| Type                                     | Guide                                    |
| ---------------------------------------- | ---------------------------------------- |
| `TableCfg`, `ColumnCfg`                  | [Schema and validation](/guides/schema/) |
| `throwOnInvalidTableCfg`                 | [Schema and validation](/guides/schema/) |
| `Validate`, `BaseValidator`, `Validator` | [Schema and validation](/guides/schema/) |

## Edit protocol

| Type                                             | Guide                                   |
| ------------------------------------------------ | --------------------------------------- |
| `Insert`, `validateInsert`                       | [Edit protocol](/guides/edit-protocol/) |
| `InsertHistoryRow`, `InsertHistoryTimeId`        | [Edit protocol](/guides/edit-protocol/) |
| `Edit`, `EditAction`, `MultiEdit`, `EditHistory` | [Edit protocol](/guides/edit-protocol/) |

## Routing

| Type    | Guide                       |
| ------- | --------------------------- |
| `Route` | [Routing](/guides/routing/) |

## Sync protocol

| Type                                           | Guide                                   |
| ---------------------------------------------- | --------------------------------------- |
| `ConnectorPayload`, `AckPayload`               | [Sync protocol](/guides/sync-protocol/) |
| `GapFillRequest`, `GapFillResponse`            | [Sync protocol](/guides/sync-protocol/) |
| `SyncConfig`, `syncEvents`                     | [Sync protocol](/guides/sync-protocol/) |
| `clientId`, `isClientId`                       | [Sync protocol](/guides/sync-protocol/) |
| `Conflict`, `ConflictCallback`, `ConflictType` | [Sync protocol](/guides/sync-protocol/) |

## Utilities

| Type                                       | Guide                                      |
| ------------------------------------------ | ------------------------------------------ |
| `timeId`, `isTimeId`, `getTimeIdTimestamp` | [Edit protocol](/guides/edit-protocol/)    |
| `removeDuplicates`                         | [Tables, rows and hashes](/guides/tables/) |
