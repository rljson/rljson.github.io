// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

// Shared by the specs of src/content/docs/guides/db/: generates a car world
// and imports it into a Db. The import page shows its regions.

// #region imports
import { Db } from '@rljson/db';
import type { ColumnInfo } from '@rljson/db';
import { Edge } from '@rljson/edge';
// #endregion imports

// #region setup
export const carWorldDb = async () => {
  // Generate the smallest world: one manufacturer, one catalog of five cars,
  // parts and CAD scenes
  const { world } = await Edge.preset('tiny').generate();

  // Create a Db on an in memory Io
  const db = await Db.example();

  // Import the world as it is, creating the tables it describes
  await db.core.import(world, { createTables: true });

  const catalogRef = world.catalogs._data[0]._hash as string;
  return { world, db, catalogRef };
};
// #endregion setup

// #region columns
// A column of a view: a short alias and the route from the cake to a value
export const column = (
  alias: string,
  route: string,
  type: ColumnInfo['type'] = 'string',
): ColumnInfo => ({
  key: alias,
  alias,
  route: `catalogs/${route}`,
  type,
  titleLong: alias,
  titleShort: alias,
});
// #endregion columns
