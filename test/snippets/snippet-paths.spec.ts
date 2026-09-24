// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

import { relative } from 'node:path';
import { goldenDir } from '@tssuite/golden';
import { describe, expect, it } from 'vitest';

import { snippetPaths } from '../../src/snippets/snippet-paths';

describe('snippetPaths(page, file)', () => {
  it('looks next to the spec of the page and in its goldens', () => {
    expect(snippetPaths('src/content/docs/guides/x.mdx', 'a.json')).toEqual([
      'test/content/docs/guides/a.json',
      'test/goldens/content/docs/guides/x/a.json',
    ]);
  });

  it('handles .md pages, pages at the top and Windows paths', () => {
    expect(snippetPaths('src/content/docs/index.md', 'index.spec.ts')).toEqual([
      'test/content/docs/index.spec.ts',
      'test/goldens/content/docs/index/index.spec.ts',
    ]);
    expect(snippetPaths('src\\content\\docs\\guides\\x.mdx', 'a.json')).toEqual(
      [
        'test/content/docs/guides/a.json',
        'test/goldens/content/docs/guides/x/a.json',
      ],
    );
  });

  it('looks where writeGolden writes the outputs of the spec', async () => {
    const root = process.cwd();
    const spec = `${root}/test/content/docs/guides/x.spec.ts`;
    const goldens = await goldenDir(`Error\n    at ${spec}:1:1`, root);

    expect(snippetPaths('src/content/docs/guides/x.mdx', 'a.json')[1]).toBe(
      `${relative(root, goldens)}/a.json`,
    );
  });
});
