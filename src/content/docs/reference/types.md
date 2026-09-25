---
title: Type reference
description: A quick index of the exported types of @rljson/rljson.
---

A short index of what `@rljson/rljson` exports, and where each type is
explained.

## Data model

| Type                                   | Guide                                 |
| -------------------------------------- | ------------------------------------- |
| `ComponentsTable`                      | [Data types](/guides/old/data-types/) |
| `SliceIds`, `SliceIdsTable`            | [Data types](/guides/old/data-types/) |
| `Layer`, `LayersTable`                 | [Data types](/guides/old/data-types/) |
| `Cake`, `CakesTable`                   | [Data types](/guides/old/data-types/) |
| `Buffet`, `BuffetsTable`               | [Data types](/guides/old/data-types/) |
| `Tree`, `TreesTable`, `treeFromObject` | [Data types](/guides/old/data-types/) |

## Schema

| Type                                     | Guide                                        |
| ---------------------------------------- | -------------------------------------------- |
| `TableCfg`, `ColumnCfg`                  | [Schema and validation](/guides/old/schema/) |
| `throwOnInvalidTableCfg`                 | [Schema and validation](/guides/old/schema/) |
| `Validate`, `BaseValidator`, `Validator` | [Schema and validation](/guides/old/schema/) |

## Edit protocol

| Type                                             | Guide                                       |
| ------------------------------------------------ | ------------------------------------------- |
| `Insert`, `validateInsert`                       | [Edit protocol](/guides/old/edit-protocol/) |
| `InsertHistoryRow`, `InsertHistoryTimeId`        | [Edit protocol](/guides/old/edit-protocol/) |
| `Edit`, `EditAction`, `MultiEdit`, `EditHistory` | [Edit protocol](/guides/old/edit-protocol/) |

## Routing

| Type    | Guide                           |
| ------- | ------------------------------- |
| `Route` | [Routing](/guides/old/routing/) |

## Sync protocol

| Type                                           | Guide                                       |
| ---------------------------------------------- | ------------------------------------------- |
| `ConnectorPayload`, `AckPayload`               | [Sync protocol](/guides/old/sync-protocol/) |
| `GapFillRequest`, `GapFillResponse`            | [Sync protocol](/guides/old/sync-protocol/) |
| `SyncConfig`, `syncEvents`                     | [Sync protocol](/guides/old/sync-protocol/) |
| `clientId`, `isClientId`                       | [Sync protocol](/guides/old/sync-protocol/) |
| `Conflict`, `ConflictCallback`, `ConflictType` | [Sync protocol](/guides/old/sync-protocol/) |

## Utilities

| Type                                       | Guide                                          |
| ------------------------------------------ | ---------------------------------------------- |
| `timeId`, `isTimeId`, `getTimeIdTimestamp` | [Edit protocol](/guides/old/edit-protocol/)    |
| `removeDuplicates`                         | [Tables, rows and hashes](/guides/old/tables/) |
