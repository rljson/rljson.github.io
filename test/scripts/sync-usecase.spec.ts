// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

import { readdir, readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

import { imageDir, targetPage, themeSvg, toSitePage } from '../../scripts/sync-usecase.js';

const svg = [
  '<svg xmlns="http://www.w3.org/2000/svg" class="uc uc-x" viewBox="0 0 960 400" width="960" height="400">',
  '<style>',
  'svg.uc{--uc-bg:#fff}',
  '@media (prefers-color-scheme: dark){svg.uc{--uc-bg:#000}}',
  '</style>',
  '</svg>',
].join('\n');

describe('sync-usecase', () => {
  it('switches the colors of an image with the theme of the site', () => {
    const themed = themeSvg(svg);
    expect(themed).toContain(":root[data-theme='dark'] svg.uc{--uc-bg:#000}");
    expect(themed).not.toContain('prefers-color-scheme');
    expect(themed).toContain('style="width:100%;height:auto"');
  });

  it('turns the page of edge into a page of the site', async () => {
    const markdown = [
      '<!-- license -->',
      '',
      '# The car world',      '',
      'Edge invents a world.',
      '',
      '![A picture](img/x.svg)',
      '',
      'More text.',
      '',
    ].join('\n');
    const page = await toSitePage(markdown, async () => svg);
    expect(page).toMatch(/^---\ntitle: Example Usecase\ndescription: "Edge invents a world."\n---/);
    expect(page).not.toContain('# The car world');
    expect(page).not.toContain('license');
    expect(page).toContain('<figure class="uc-figure">\n<svg');
    expect(page).toContain('More text.');
  });

  it('keeps the generated page in the repo', async () => {
    const page = await readFile(targetPage, 'utf8');
    expect(page).toContain('title: Example Usecase');
    expect(page.match(/<svg/g)?.length).toBe(7);
  });

  it('keeps the themed images for the chapters in the repo', async () => {
    const images = await readdir(imageDir);
    expect(images.filter((f) => f.endsWith('.svg')).length).toBe(7);
    const svg = await readFile(`${imageDir}/usecase-parts.svg`, 'utf8');
    expect(svg).toContain(":root[data-theme='dark'] svg.uc{");
  });
});
