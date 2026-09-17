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

| Path                          | Purpose                                    |
| ----------------------------- | ------------------------------------------ |
| `src/content/docs/index.mdx`  | Landing page                               |
| `src/content/docs/guides/`    | Start here, Format and Protocols guides    |
| `src/content/docs/reference/` | Ecosystem and type reference               |
| `src/assets/logo/`            | Rljson logos, taken from `@rljson/icons`   |
| `src/assets/figures/`         | Architecture figures, from `@rljson/icons` |
| `public/`                     | Favicon and touch icon                     |
| `astro.config.mjs`            | Site title, logo, social links and sidebar |

Images come from [`@rljson/icons`](https://github.com/rljson/icons). Update
them there and copy the result over, rather than editing the copies here.

## Commands

| Command        | Action                                   |
| -------------- | ---------------------------------------- |
| `pnpm install` | Install the dependencies                 |
| `pnpm dev`     | Start the dev server at `localhost:4321` |
| `pnpm build`   | Run the tests and build to `./dist/`     |
| `pnpm preview` | Preview the build locally                |
| `pnpm test`    | Run the tests and `astro check`          |
| `pnpm format`  | Format the sources with Prettier         |
