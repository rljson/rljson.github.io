// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

/**
 * Returns the paths where a snippet file of a page can live.
 *
 * The test tree mirrors the page tree: the spec of a page sits at the same
 * path below `test/`, and `writeGolden` writes the outputs of that spec below
 * `test/goldens/`. For `src/content/docs/guides/x.mdx` these are the folders
 * `test/content/docs/guides/` and `test/goldens/content/docs/guides/x/`.
 * @param page - The source file of the page, relative to the repo root
 * @param file - The snippet file, relative to one of these folders
 */
export const snippetPaths = (page: string, file: string): string[] => {
  const path = page
    .replace(/\\/g, '/')
    .replace(/^(\.\/)?src\//, '')
    .replace(/\.mdx?$/, '');
  const dir = path.slice(0, path.lastIndexOf('/'));

  return [`test/${dir}/${file}`, `test/goldens/${path}/${file}`];
};
