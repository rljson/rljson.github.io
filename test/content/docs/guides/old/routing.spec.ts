// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

// Snippets for src/content/docs/guides/routing.mdx

// #region route
import { Route } from '@rljson/rljson';
// #endregion route

import { describe, expect, it } from 'vitest';

describe('Routing', () => {
  it('Route: parses a flat route and serializes it back', () => {
    // #region route
    // Parse a flat route string
    const route = Route.fromFlat('/ingredients@A5d.../nutritionalValues');

    // First and last segment
    expect(route.top).toEqual({
      tableKey: 'ingredients',
      ingredientsRef: 'A5d...',
    });
    expect(route.root).toEqual({ tableKey: 'nutritionalValues' });

    // Segment by index
    expect(route.segment(0)).toEqual(route.top);

    // Serialized back to a string
    expect(route.flat).toBe('/ingredients@A5d.../nutritionalValues');
    // #endregion route
  });

  // Guards the table of segment syntaxes on the page
  it('Route segments: carry a ref, slice ids or an InsertHistory ref', () => {
    const top = (flat: string) => Route.fromFlat(flat).top;

    expect(top('/ingredients@A5d...')).toEqual({
      tableKey: 'ingredients',
      ingredientsRef: 'A5d...',
    });
    expect(top('/cakes(slice0,slice1)')).toEqual({
      tableKey: 'cakes',
      sliceIds: ['slice0', 'slice1'],
    });
    expect(top('/ingredients@1700000000000:AbCd')).toEqual({
      tableKey: 'ingredients',
      ingredientsInsertHistoryRef: '1700000000000:AbCd',
    });
  });
});
