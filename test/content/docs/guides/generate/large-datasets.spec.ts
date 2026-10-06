// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

// Snippets for src/content/docs/guides/generate/large-datasets.mdx
//
// The region "app" is the sample application of the tutorial. It runs when
// vitest imports this file. The tests below check what it has built.

// #region app
// #region presets
import { Edge, edgePresetNames } from '@rljson/edge';
// #endregion presets
// #region ndjson
import { once } from 'node:events';
import { createWriteStream, type WriteStream } from 'node:fs';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
// #endregion ndjson
// #endregion app

import { writeGolden } from '@tssuite/golden';
import { describe, expect, it, vi } from 'vitest';

// Record what the application prints
const log = vi.spyOn(console, 'log').mockImplementation(() => {});

// #region app
// #region presets
// An estimate costs nothing: no row is generated
for (const name of edgePresetNames) {
  const { cars, rowsTotal, approxBytes } = Edge.preset(name).estimate();
  const megabytes = Math.round(approxBytes / 1e6);
  console.log(
    `${name.padEnd(7)} ${String(cars).padStart(10)} cars ` +
      `${String(rowsTotal).padStart(11)} rows ${String(megabytes).padStart(6)} MB`,
  );
}
// #endregion presets

// #region target
// Name the size you want. The generator scales the cars per catalog.
// With sharing per car, every car adds rows of its own.
const generator = new Edge({
  manufacturers: { count: 4, catalogsPerManufacturer: 2 },
  scale: { targetRows: 20000 },
  layers: {
    parts: { depth: 2, fanOut: 2, sharing: 'perCar' },
    cad: { depth: 2, fanOut: 2, sharing: 'perCar' },
  },
});
console.log(`cars per catalog: ${generator.config.catalogs.carsPerCatalog}`);
console.log(`estimated rows: ${generator.estimate().rowsTotal}`);
// #endregion target

// #region callback
// run() hands every row to the callback and keeps nothing
const rows: Record<string, number> = {};
const stats = await generator.run({
  onRow: (table) => {
    rows[table] = (rows[table] ?? 0) + 1;
  },
});
const received = Object.values(rows).reduce((sum, count) => sum + count, 0);
console.log(`received ${received} of ${stats.rowsTotal} rows`);
console.log(
  `${rows.parts} parts, ${rows.cadScenes} nodes, ${rows.prices} prices`,
);
// #endregion callback

// #region ndjson
// One write stream per table, opened on the first row of the table
const dir = await mkdtemp(join(tmpdir(), 'car-world-'));
const files = new Map<string, WriteStream>();
const fileOf = (table: string): WriteStream => {
  let file = files.get(table);
  if (!file) {
    file = createWriteStream(join(dir, `${table}.ndjson`));
    files.set(table, file);
  }
  return file;
};

// Every row becomes one line. When a stream falls behind, wait for it.
await generator.run({
  onRow: async (table, row) => {
    if (!fileOf(table).write(JSON.stringify(row) + '\n')) {
      await once(fileOf(table), 'drain');
    }
  },
});
for (const file of files.values()) {
  file.end();
  await once(file, 'finish');
}

const prices = await readFile(join(dir, 'prices.ndjson'), 'utf8');
const lines = prices.trim().split('\n');
console.log(`${files.size} files, prices.ndjson has ${lines.length} lines`);
console.log(`first line: ${lines[0]}`);
// #endregion ndjson

// #region progress
// progress reports every new phase without a table, and every
// progressEvery rows with the table of the last row
const reporter = new Edge({
  ...generator.config,
  progressEvery: 5000,
  progress: (p) => {
    if (p.table) {
      console.log(`${p.rowsDone} of ${p.rowsTotal} rows, ${p.table}`);
    }
  },
});
await reporter.run();
// #endregion progress

// #region abort
// An AbortSignal stops a run after the current row
const controller = new AbortController();
const stoppable = new Edge({
  ...generator.config,
  abortSignal: controller.signal,
  progressEvery: 1000,
  progress: (p) => {
    if (p.rowsDone >= 3000) controller.abort();
  },
});

try {
  await stoppable.run();
} catch (error) {
  console.log(`stopped: ${(error as Error).message}`);
}
// #endregion abort
// #endregion app

const output = log.mock.calls.map((args) => args.join(' ')).join('\n');
log.mockRestore();

describe('Large datasets tutorial', () => {
  it('estimates the presets without generating', async () => {
    const presets = output
      .split('\n')
      .filter((line) => edgePresetNames.some((name) => line.startsWith(name)))
      .join('\n');
    await writeGolden('presets.txt', presets);

    expect(Edge.preset('tiny').estimate().cars).toBe(5);
    expect(Edge.preset('large').estimate().rowsTotal).toBeGreaterThan(
      20_000_000,
    );
    expect(Edge.preset('xl').estimate().cars).toBe(20_000_000);
  });

  it('scales the cars per catalog to the target rows', () => {
    const { rowsTotal } = generator.estimate();
    expect(rowsTotal).toBeLessThanOrEqual(20000);
    expect(rowsTotal).toBeGreaterThan(15000);
    expect(generator.config.catalogs.carsPerCatalog).toBeTypeOf('number');
  });

  it('hands every row to the callback', () => {
    expect(received).toBe(stats.rowsTotal);
    expect(rows.catalogs).toBe(8);
  });

  it('writes one NDJSON file per table from the callback', () => {
    expect(files.has('prices')).toBe(true);
    expect(lines).toHaveLength(rows.prices);
    expect(JSON.parse(lines[0])).toHaveProperty('_hash');
  });

  it('reports the progress and stops on abort', async () => {
    await writeGolden('output.txt', output);

    expect(output).toContain('5000 of ');
    expect(output).toContain(
      'stopped: Edge: generation aborted after 3000 rows',
    );
  });
});
