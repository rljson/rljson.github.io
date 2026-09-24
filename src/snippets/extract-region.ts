// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

// Matches `// #region name` and `// #endregion name`, the markers VS Code
// folds and VitePress imports.
const marker = /^\s*\/\/\s*#(region|endregion)\b\s*(\S*)/;

/**
 * Returns the lines between `// #region <name>` and `// #endregion <name>`.
 *
 * A region may consist of several parts, e.g. its imports at the top of the
 * file and its code inside a test. The parts are joined by a blank line.
 * Marker lines of other regions are dropped, and each part is dedented.
 * @param source - The content of the file that holds the region
 * @param name - The name of the region
 */
export const extractRegion = (source: string, name: string): string => {
  const parts: string[][] = [];
  let part: string[] | undefined;

  for (const line of source.split(/\r?\n/)) {
    const match = marker.exec(line);
    if (!match) {
      part?.push(line);
      continue;
    }

    const [, kind, region] = match;
    if (region !== name) continue;

    if (kind === 'region') {
      if (part) throw new Error(`Region "${name}" is opened twice.`);
      part = [];
    } else {
      if (!part) throw new Error(`Region "${name}" is closed before opened.`);
      parts.push(part);
      part = undefined;
    }
  }

  if (part) throw new Error(`Region "${name}" is not closed.`);
  if (!parts.length) throw new Error(`Region "${name}" not found.`);

  const code = parts.map(dedent).join('\n\n');
  if (!code.trim()) throw new Error(`Region "${name}" is empty.`);
  return code;
};

const dedent = (lines: string[]): string => {
  const indent = Math.min(
    ...lines.filter((line) => line.trim()).map((line) => line.search(/\S/)),
  );

  return lines
    .map((line) => line.slice(indent).trimEnd())
    .join('\n')
    .replace(/^\n+|\n+$/g, '');
};
