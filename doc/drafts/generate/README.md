<!--
@license
Copyright (c) 2025 Rljson

Use of this source code is governed by terms that can be
found in the LICENSE file in the root of this package.
-->

# Section »Generate Rljson« – plan and drafts

A new sidebar section next to »Data Types«. It teaches `@rljson/generator`
in standalone, step-by-step tutorials, in the style of the Data Types
tutorials: each one sets up a project, builds a small application step by
step, shows the complete file and ends with what you have learned.

## Status

The pages and specs in this folder are **drafts**. They are not built and
not tested yet, because every TypeScript snippet of a page must come from a
spec that runs, and `@rljson/generator` is not published and not linked
into this repo so far. The drafts define the API the generator has to
offer. Once the generator exists, the files move into the content and test
trees and the section goes live.

| Draft                    | Target page                                           | Target spec                                            | Status  |
| ------------------------ | ----------------------------------------------------- | ------------------------------------------------------ | ------- |
| `first-dataset.mdx`      | `src/content/docs/guides/generate/first-dataset.mdx`  | `test/content/docs/guides/generate/first-dataset.spec.ts`  | draft   |
| `car-world.mdx`          | `src/content/docs/guides/generate/car-world.mdx`      | `test/content/docs/guides/generate/car-world.spec.ts`      | draft   |
| `configure.mdx`          | `src/content/docs/guides/generate/configure.mdx`      | `test/content/docs/guides/generate/configure.spec.ts`      | draft   |
| `parts-and-cad.mdx`      | `src/content/docs/guides/generate/parts-and-cad.mdx`  | `test/content/docs/guides/generate/parts-and-cad.spec.ts`  | draft   |
| `revisions.mdx`          | `src/content/docs/guides/generate/revisions.mdx`      | `test/content/docs/guides/generate/revisions.spec.ts`      | draft   |
| `large-datasets.mdx`     | `src/content/docs/guides/generate/large-datasets.mdx` | `test/content/docs/guides/generate/large-datasets.spec.ts` | draft   |
| –                        | `src/content/docs/guides/generate/in-tests.mdx`       | –                                                      | planned |
| –                        | `src/content/docs/guides/generate/faults.mdx`         | –                                                      | planned |
| –                        | `src/content/docs/guides/generate/cli.mdx`            | –                                                      | planned |
| –                        | `src/content/docs/guides/generate/into-a-database.mdx`| –                                                      | planned |

The goldens the pages show as »Output« (`output.txt`, `manufacturers.json`,
`config.json`, `presets.txt`) are written by `pnpm test` once the specs run.
Do not write them by hand.

## The tutorials

1. **Your first dataset.** Generate the `tiny` preset, list the tables,
   validate the world, read the statistics, reproduce the data from its
   seed.
2. **Walk the car world.** Follow the references from a manufacturer to
   its catalogs, the cars of a catalog and the price, brand and workshop of
   each car. Shows how reference arrays, cakes, layers and components fit
   together, and that shared rows are stored once.
3. **Configure the generator.** Replace the preset by a configuration:
   counts and ranges, layers on and off, price ranges and currencies, Zipf
   popularity of models. Estimate before generating, compare with the
   statistics, read the resolved configuration.
4. **Parts and CAD scenes.** Bills of materials as components that refer to
   sub parts up to four levels deep, CAD scenes as trees. Walk both, count
   references against rows to see deduplication, follow `meta.partRef` from
   a mesh to its part.
5. **Catalog revisions.** Model years as derived slice ids, derived layers
   with `base`, `add` and `remove`, and a revisions table that links the
   versions. Resolve a derived layer the way `resolveSliceIds` resolves
   slice ids.
6. **Generate large datasets.** Estimate all presets, pick a target size,
   receive the rows through the `run` callback, write NDJSON files from it,
   watch the progress, stop a run with an `AbortSignal`.

Planned, not drafted:

7. **Use generated data in tests.** Fixed seeds in vitest, goldens of a
   generated world, stable hashes as assertions, the `tiny` world as a
   fixture of the Uikit.
8. **Break the data on purpose.** The `faults` configuration: broken
   references, wrong hashes, cycles in trees, layers that miss a slice.
   For validator tests and error states in user interfaces.
9. **The command line.** `rljson generate --preset large --seed 42 --out
   ./data --format ndjson`, configuration files, progress on the terminal.
10. **Into a database.** A callback that writes a world into
    `@rljson/io-sqlite` or the browser's IndexedDB, and a query on the
    result. The generator has no dependency on `@rljson/io`.

## Sidebar

Add the section after »Data Types« in `astro.config.mjs`:

```js
{
  label: 'Generate Rljson',
  items: [
    { label: 'Your first dataset', slug: 'guides/generate/first-dataset' },
    { label: 'Walk the car world', slug: 'guides/generate/car-world' },
    { label: 'Configure the generator', slug: 'guides/generate/configure' },
    { label: 'Parts and CAD scenes', slug: 'guides/generate/parts-and-cad' },
    { label: 'Catalog revisions', slug: 'guides/generate/revisions' },
    { label: 'Generate large datasets', slug: 'guides/generate/large-datasets' },
    // { label: 'Use generated data in tests', slug: 'guides/generate/in-tests' },
    // { label: 'Break the data on purpose', slug: 'guides/generate/faults' },
    // { label: 'The command line', slug: 'guides/generate/cli' },
    // { label: 'Into a database', slug: 'guides/generate/into-a-database' },
  ],
},
```

The landing page can get a third card under »Get going«: _Generate test
data_, linking to the first tutorial. The type reference gets a section for
`@rljson/generator`.

## How to activate the section

1. Add the generator repo (`rljson_generator`) to the ticket, so that `gg`
   links it into this repo like `@rljson/rljson`: an entry in
   `.gg/ts_links/@rljson/generator` and an override in
   `pnpm-workspace.yaml`.
2. Add `@rljson/generator` to the `devDependencies` of `package.json`.
3. Move each draft to its target page and spec, see the table above.
4. Run `pnpm test`. It runs the applications, writes the goldens below
   `test/goldens/content/docs/guides/generate/<page>/` and checks the
   types. Review the goldens in git.
5. Add the sidebar section and preview each page.

## Test strategy

- Every spec runs a tiny configuration: a few cars, trees of two or three
  levels. A spec should finish well below a second.
- Every configuration carries a fixed seed. Nothing the pages print may
  depend on the clock: no `durationMs`, no `generatedAt`. Timestamps in the
  data derive from the configured model year.
- The estimates in `presets.txt` come from `estimate()`, so a change of a
  preset changes the golden. That is intended: the page documents the
  current presets.
- The specs assert structure, not generated names: counts, the equality of
  hashes between runs with the same seed, empty validation results.
- The generator has no file system or database dependency and runs in the
  browser. Where a tutorial writes files, the tutorial application does it
  with `node:fs` inside the `run` callback, never the generator.

## Figures

The Data Types tutorials open with a figure from `@rljson/icons`. The
drafts use text diagrams instead. Proposed figures, to be drawn in the icons
repo and copied to `src/assets/figures/`:

| Figure              | Shows                                                        |
| ------------------- | ------------------------------------------------------------ |
| `car-world.svg`     | Manufacturers → catalogs → cars, with the table types        |
| `parts-levels.svg`  | A bill of materials: assembly, sub assembly, part, standard part |
| `cad-scene.svg`     | A scene graph: body, chassis, interior, wheels, with meshes    |

## The API the drafts rely on

The generator has to export what the specs import:

- `Generator` with `constructor(config)`, `static preset(name, overrides?)`,
  `config`, `estimate()`, `generate()` and `run(sink?)`
- `presetNames`
- the types `GeneratorConfig`, `RowSink`, `CarWorld`, `Part` and `CadMeta`

The full interface is described in the design document of the ticket,
`generator-design.md`, section 6.

The ticket folder also holds `generator-api.d.ts`, an ambient declaration
of that interface. To type-check the drafts before the generator exists,
copy it next to the specs and run:

```bash
node_modules/.bin/tsc --ignoreConfig --noEmit --strict --target es2022 --module nodenext --moduleResolution nodenext --allowImportingTsExtensions --types vitest/globals,node doc/drafts/generate/generator-api.d.ts doc/drafts/generate/*.spec.ts
```

Remove the copy afterwards: once the real package is linked, the ambient
declaration would shadow it.
