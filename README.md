<!--
@license
Copyright (c) 2025 Rljson

Use of this source code is governed by terms that can be
found in the LICENSE file in the root of this package.
-->

# rljson.github.io

The documentation website of Rljson, built with
[Astro](https://astro.build) and [Starlight](https://starlight.astro.build)
and published at [rljson.github.io](https://rljson.github.io).

## Content

| Path                                  | Purpose                                    |
| ------------------------------------- | ------------------------------------------ |
| `src/content/docs/index.mdx`          | Landing page                               |
| `src/content/docs/guides/data_types/` | Tutorials on the data types                |
| `src/content/docs/guides/old/`        | Start here, Format and Protocols guides    |
| `src/content/docs/reference/`         | Ecosystem and type reference               |
| `src/assets/logo/`                    | Rljson logos, taken from `@rljson/icons`   |
| `src/assets/figures/`                 | Architecture figures, from `@rljson/icons` |
| `src/components/Snippet.astro`        | Shows a region of a tested file            |
| `src/snippets/`                       | Extracts a region from a file              |
| `test/content/docs/`                  | The tested code of each page               |
| `test/goldens/`                       | The outputs the pages show                 |
| `public/`                             | Favicon and touch icon                     |
| `astro.config.mjs`                    | Site title, logo, social links and sidebar |

Images come from [`@rljson/icons`](https://github.com/rljson/icons). Update
them there and copy the result over, rather than editing the copies here.

## Code snippets

Every TypeScript snippet on a page comes from a test. So it compiles and runs
against the pinned `@rljson/*` versions.

- Write the code of `src/content/docs/<page>.mdx` into
  `test/content/docs/<page>.spec.ts`
- Mark each snippet with `// #region <name>` and `// #endregion <name>`
- Give each snippet its own import line at the top of the file, marked with
  the same name
- Put the checks the reader should see into the region, all others after it
- Write larger results with `writeGolden('<name>.json', value)` from
  `@tssuite/golden`. It writes them to `test/goldens/content/docs/<page>/`
- Show a snippet with `<Snippet file="<page>.spec.ts" region="<name>" />`
- Show an output with `<Snippet file="<name>.json" title="Output" />`

`<Snippet>` takes only the file name. It looks for the file next to the
page's spec and in the page's goldens.

```mdx
import Snippet from '../../../components/Snippet.astro';

<Snippet
  file="routing.spec.ts"
  region="route"
/>
```

Keep shell commands and JSON that only sketches the format inline.

A missing file or region fails `astro build`. A type error in a spec fails
`astro check`. `pnpm test` rewrites the outputs, so review their changes in
git.

### Tutorials

Each tutorial in `guides/data_types/` builds a sample application. Its spec
keeps the application in the region `app`, at the top level of the file, so
the complete file on the page is exactly the tested code. Each step of the
tutorial is a region nested in `app`. The application runs when vitest
imports the spec, and the tests check what it has built. The spec records
what the application prints and writes it to `output.txt`.

## Preview a page

Open the `.mdx` file of a page and start `Preview page` in Run and Debug.
VS Code shows the page in its integrated browser, rendered by the Astro dev
server. The page reloads when you change it or its spec. For the landing page,
open `/` there.

The MDX Preview extension cannot render Astro components, so it fails on
these pages.

## Commands

| Command        | Action                                   |
| -------------- | ---------------------------------------- |
| `pnpm install` | Install the dependencies                 |
| `pnpm dev`     | Start the dev server at `localhost:4321` |
| `pnpm build`   | Run the tests and build to `./dist/`     |
| `pnpm preview` | Preview the build locally                |
| `pnpm test`    | Run the tests and `astro check`          |
| `pnpm format`  | Format the sources with Prettier         |
