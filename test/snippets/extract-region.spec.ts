// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

import { describe, expect, it } from 'vitest';

import { extractRegion } from '../../src/snippets/extract-region';

const lines = (...l: string[]) => l.join('\n');

describe('extractRegion(source, name)', () => {
  it('returns the dedented lines of the region', () => {
    const source = lines(
      'it(() => {',
      '    // #region a',
      '    const x = 1;',
      '    if (x) {',
      '      run(x);',
      '    }',
      '    // #endregion a',
      '});',
    );

    expect(extractRegion(source, 'a')).toBe(
      lines('const x = 1;', 'if (x) {', '  run(x);', '}'),
    );
  });

  it('joins several parts by a blank line', () => {
    const source = lines(
      '// #region a',
      "import { x } from 'x';",
      '// #endregion a',
      '  // #region a',
      '  x();',
      '  // #endregion a',
    );

    expect(extractRegion(source, 'a')).toBe(
      lines("import { x } from 'x';", '', 'x();'),
    );
  });

  it('drops the markers of nested regions', () => {
    const source = lines(
      '// #region outer',
      'a();',
      '// #region inner',
      'b();',
      '// #endregion inner',
      '// #endregion outer',
    );

    expect(extractRegion(source, 'outer')).toBe(lines('a();', 'b();'));
    expect(extractRegion(source, 'inner')).toBe('b();');
  });

  it('trims blank lines around a part and handles CRLF', () => {
    const source = '// #region a\r\n\r\na();  \r\n\r\n// #endregion a\r\n';
    expect(extractRegion(source, 'a')).toBe('a();');
  });

  for (const [source, error] of [
    ['x();', 'Region "a" not found.'],
    ['// #region a\nx();', 'Region "a" is not closed.'],
    ['// #endregion a', 'Region "a" is closed before opened.'],
    ['// #region a\n// #region a', 'Region "a" is opened twice.'],
    ['// #region a\n\n// #endregion a', 'Region "a" is empty.'],
  ]) {
    it(`throws "${error}"`, () => {
      expect(() => extractRegion(source, 'a')).toThrow(error);
    });
  }
});
