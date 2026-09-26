// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

// Snippets for src/content/docs/guides/data_types/components.mdx
//
// The region "app" is the sample application of the tutorial. It runs when
// vitest imports this file. The tests below check what it has built.

// #region app
// #region types
import type { Ref } from '@rljson/rljson';
// #endregion types
// #region manufacturers
import { hip } from '@rljson/hash';
import type { ComponentsTable } from '@rljson/rljson';
// #endregion manufacturers
// #region validate
import { BaseValidator, type Rljson, Validate } from '@rljson/rljson';
// #endregion validate
// #endregion app

import { writeGolden } from '@tssuite/golden';
import { describe, expect, it, vi } from 'vitest';

// Record what the application prints
const log = vi.spyOn(console, 'log').mockImplementation(() => {});

// #region app
// #region types
type Manufacturer = {
  id: string;
  country: string;
  founded: number;
};

type Car = {
  id: string;
  seats: number;
  manufacturersRef: Ref;
};

type Wheel = {
  carsRef: Ref;
  position: 'front' | 'rear';
  diameter: number; // inch
  width: number; // mm
};
// #endregion types

// #region manufacturers
const manufacturers = hip<ComponentsTable<Manufacturer>>({
  _type: 'components',
  _data: [
    { id: 'porsche', country: 'Germany', founded: 1931 },
    { id: 'volvo', country: 'Sweden', founded: 1927 },
  ],
});

/** Returns the reference to a row: the hash that hip wrote into it */
const ref = (row: object): Ref => (row as { _hash: Ref })._hash;

const [porsche, volvo] = manufacturers._data;
// #endregion manufacturers

// #region cars
const cars = hip<ComponentsTable<Car>>({
  _type: 'components',
  _data: [
    { id: 'taycan', seats: 4, manufacturersRef: ref(porsche) },
    { id: 'ex30', seats: 5, manufacturersRef: ref(volvo) },
  ],
});
// #endregion cars

// #region wheels
const [taycan, ex30] = cars._data;

const wheels = hip<ComponentsTable<Wheel>>({
  _type: 'components',
  _data: [
    { carsRef: ref(taycan), position: 'front', diameter: 20, width: 245 },
    { carsRef: ref(taycan), position: 'rear', diameter: 21, width: 285 },
    { carsRef: ref(ex30), position: 'front', diameter: 19, width: 245 },
    { carsRef: ref(ex30), position: 'rear', diameter: 19, width: 245 },
  ],
});
// #endregion wheels

// #region validate
const carCatalog: Rljson = { manufacturers, cars, wheels };

const validate = new Validate();
validate.addValidator(new BaseValidator());

const errors = await validate.run(carCatalog);
if (Object.keys(errors).length > 0) {
  throw new Error(JSON.stringify(errors, null, 2));
}
// #endregion validate

// #region list
/** Follows a reference: finds the row with the given hash */
const rowOf = <T extends object>(table: { _data: T[] }, hash: Ref): T =>
  table._data.find((row) => ref(row) === hash)!;

for (const wheel of wheels._data) {
  const car = rowOf(cars, wheel.carsRef);
  const manufacturer = rowOf(manufacturers, car.manufacturersRef);

  console.log(
    `${car.id} ${wheel.position}: ${wheel.diameter}″ × ${wheel.width} mm, ` +
      `by ${manufacturer.id} (${manufacturer.country})`,
  );
}
// #endregion list
// #endregion app

const output = log.mock.calls.map((args) => args.join(' ')).join('\n');
log.mockRestore();

describe('Components tutorial', () => {
  it('hashes each row and the table', async () => {
    await writeGolden('manufacturers.json', manufacturers);

    const hashes = manufacturers._data.map(ref);
    expect(hashes.every((hash) => typeof hash === 'string')).toBe(true);
    expect(ref(manufacturers)).toBeTypeOf('string');
  });

  it('gives equal content an equal hash', () => {
    // #region same-content
    const porscheAgain = hip<Manufacturer>({
      founded: 1931,
      country: 'Germany',
      id: 'porsche',
    });

    expect(ref(porscheAgain)).toBe(ref(porsche)); // same content, same hash
    // #endregion same-content
  });

  it('references rows by their hash', async () => {
    await writeGolden('cars.json', cars);

    expect(taycan.manufacturersRef).toBe(ref(porsche));
    expect(wheels._data[0].carsRef).toBe(ref(taycan));
  });

  it('validates the car catalog', () => {
    expect(errors).toEqual({});
    expect(new BaseValidator().validateSync(carCatalog)).toEqual({
      hasErrors: false,
    });
  });

  it('lists every wheel with its car and manufacturer', async () => {
    await writeGolden('output.txt', output);

    expect(output).toBe(
      [
        'taycan front: 20″ × 245 mm, by porsche (Germany)',
        'taycan rear: 21″ × 285 mm, by porsche (Germany)',
        'ex30 front: 19″ × 245 mm, by volvo (Sweden)',
        'ex30 rear: 19″ × 245 mm, by volvo (Sweden)',
      ].join('\n'),
    );
  });

  it('detects a row that was changed in place', async () => {
    // #region changed-in-place
    const changed = structuredClone(carCatalog);
    changed.manufacturers._data[0].founded = 1948; // the hash stays the same

    const result = await validate.run(changed);
    // #endregion changed-in-place

    await writeGolden('changed-in-place.json', result);
    expect(result.base.hashesNotValid).toBeDefined();
  });

  it('does not check references without a TableCfg', async () => {
    const brokenRef = structuredClone(carCatalog);
    brokenRef.cars._data[0].manufacturersRef = 'MISSING';
    hip(brokenRef, { updateExistingHashes: true, throwOnWrongHashes: false });

    expect(await validate.run(brokenRef)).toEqual({});
  });
});
