// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

// Shared by the specs of src/content/docs/guides/db/: generates a car world
// and imports it into a Db. The import page shows its regions.

// #region imports
import { Db } from '@rljson/db';
import type { ColumnInfo, Join } from '@rljson/db';
import { Edge } from '@rljson/edge';
import { IoMem } from '@rljson/io';
// #endregion imports

// #region setup
export const carWorldDb = async () => {
  // Generate the smallest world: one manufacturer, one catalog of five cars,
  // parts and CAD scenes
  const { world } = await Edge.preset('tiny').generate();

  // Create a Db on an in memory Io
  const io = new IoMem();
  await io.init();
  await io.isReady();
  const db = new Db(io);

  // Create the tables the world describes, then import the world as it is
  await db.core.createTablesFromData(world);
  await db.core.import(world);

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

// #region print
// Formats the rows of a view as a table. Every cell is an array: a route
// that runs through a reference array yields one value per reference.
export const formatView = (join: Join): string => {
  const header = join.columnSelection.aliases;
  const rows = join.rows.map((row) =>
    row.map((cell: unknown[]) => cell.join(', ')),
  );
  const widths = header.map((title, i) =>
    Math.max(title.length, ...rows.map((row) => row[i].length)),
  );
  const line = (cells: string[]) =>
    cells
      .map((cell, i) => cell.padEnd(widths[i]))
      .join(' | ')
      .trimEnd();

  return [
    line(header),
    widths.map((w) => '-'.repeat(w)).join('-|-'),
    ...rows.map(line),
  ].join('\n');
};
// #endregion print
