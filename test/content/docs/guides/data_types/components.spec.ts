// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

// Snippets for src/content/docs/guides/data_types/components.mdx
//
// The region "app" is the sample application of the tutorial. It runs when
// vitest imports this file. The tests below check what it has built.
//
// The regions "wheel-count" and "four-wheels" are the first two designs of
// the cars table. The tutorial replaces them by the design in "wheel-array".

// #region app
// #region manufacturers
import { hip } from '@rljson/hash';
import { type ComponentsTable, ref } from '@rljson/rljson';
// #endregion manufacturers
// #region wheels
import type { Ref } from '@rljson/rljson';
// #endregion wheels
// #region validate
import { BaseValidator, type Rljson, Validate } from '@rljson/rljson';
// #endregion validate
// #region table-cfg
import type { TableCfg, TablesCfgTable } from '@rljson/rljson';
// #endregion table-cfg
// #region list
import { rowOf } from '@rljson/rljson';
// #endregion list
// #endregion app

import { writeGolden } from '@tssuite/golden';
import { describe, expect, it, vi } from 'vitest';

// Record what the application prints
const log = vi.spyOn(console, 'log').mockImplementation(() => {});

// #region app
// #region manufacturers
type Manufacturer = {
  id: string;
  country: string;
  founded: number;
};

// hip writes a hash into every row and into the table
const manufacturers = hip<ComponentsTable<Manufacturer>>({
  _type: 'components',
  _data: [
    { id: 'porsche', country: 'Germany', founded: 1931 },
    { id: 'volvo', country: 'Sweden', founded: 1927 },
    { id: 'bbs', country: 'Germany', founded: 1970 },
  ],
});

const [porsche, volvo, bbs] = manufacturers._data;
// #endregion manufacturers

// #region wheels
type Wheel = {
  manufacturersRef: Ref;
  diameter: number; // inch
  width: number; // mm
};

// Each wheel refers to its manufacturer by the manufacturer's hash
const wheels = hip<ComponentsTable<Wheel>>({
  _type: 'components',
  _data: [
    { manufacturersRef: ref(porsche), diameter: 20, width: 245 },
    { manufacturersRef: ref(porsche), diameter: 20, width: 285 },
    { manufacturersRef: ref(bbs), diameter: 19, width: 245 },
  ],
});

const [taycanFront, taycanRear, ex30Wheel] = wheels._data;
// #endregion wheels

// #region wheel-array
type Car = {
  id: string;
  manufacturersRef: Ref;
  wheelsRef: Ref[]; // front left, front right, rear left, rear right
};

// Each car refers to its wheels in an array, one reference per wheel
const cars = hip<ComponentsTable<Car>>({
  _type: 'components',
  _data: [
    {
      id: 'taycan',
      manufacturersRef: ref(porsche),
      wheelsRef: [
        ref(taycanFront),
        ref(taycanFront),
        ref(taycanRear),
        ref(taycanRear),
      ],
    },
    {
      id: 'ex30',
      manufacturersRef: ref(volvo),
      wheelsRef: [
        ref(ex30Wheel),
        ref(ex30Wheel),
        ref(ex30Wheel),
        ref(ex30Wheel),
      ],
    },
  ],
});
// #endregion wheel-array

// #region validate
// The keys are the table names, e.g. "wheels" for wheelsRef
const carCatalog: Rljson = { manufacturers, wheels, cars };

// BaseValidator checks the hashes, the names and the structure
const validate = new Validate();
validate.addValidator(new BaseValidator());

const errors = await validate.run(carCatalog);
if (Object.keys(errors).length > 0) {
  throw new Error(JSON.stringify(errors, null, 2));
}
// #endregion validate

// #region table-cfg
// The TableCfg declares the columns of the cars and their references
const carsCfg = hip<TableCfg>({
  key: 'cars',
  type: 'components',
  columns: [
    { key: '_hash', type: 'string', titleLong: 'Hash', titleShort: 'Hash' },
    { key: 'id', type: 'string', titleLong: 'Model', titleShort: 'Id' },
    {
      key: 'manufacturersRef',
      type: 'string',
      titleLong: 'Manufacturer',
      titleShort: 'Maker',
      ref: { tableKey: 'manufacturers', type: 'components' },
    },
    {
      key: 'wheelsRef',
      type: 'jsonArray',
      titleLong: 'Wheels',
      titleShort: 'Wheels',
      ref: { tableKey: 'wheels', type: 'components' },
    },
  ],
  isHead: true,
  isRoot: true,
  isShared: false,
});

// The cars table refers to its TableCfg by hash
const checkedCars = hip<ComponentsTable<Car>>({
  _type: 'components',
  _tableCfg: ref(carsCfg),
  _data: cars._data,
});

// The TableCfgs are rows, too: they go into the table tableCfgs
const checkedCatalog: Rljson = {
  tableCfgs: hip<TablesCfgTable>({ _type: 'tableCfgs', _data: [carsCfg] }),
  manufacturers,
  wheels,
  cars: checkedCars,
};

const referenceErrors = await validate.run(checkedCatalog);
if (Object.keys(referenceErrors).length > 0) {
  throw new Error(JSON.stringify(referenceErrors, null, 2));
}
// #endregion table-cfg

// #region list
// Join the tables again: car → manufacturer, car → wheels → manufacturer
for (const car of cars._data) {
  const manufacturer = rowOf(manufacturers, car.manufacturersRef);
  console.log(`${car.id} by ${manufacturer.id}`);

  car.wheelsRef.forEach((wheelRef, i) => {
    const wheel = rowOf(wheels, wheelRef);
    const wheelManufacturer = rowOf(manufacturers, wheel.manufacturersRef);

    console.log(
      `  wheel ${i}: ${wheel.diameter}″ × ${wheel.width} mm, ` +
        `by ${wheelManufacturer.id}`,
    );
  });
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

  it('refers to the manufacturer of each wheel', () => {
    expect(taycanFront.manufacturersRef).toBe(ref(porsche));
    expect(ex30Wheel.manufacturersRef).toBe(ref(bbs));
  });

  it('first counts the wheels of a car', async () => {
    // #region wheel-count
    type Car = {
      id: string;
      manufacturersRef: Ref;
      wheelCount: number;
      wheelsRef: Ref;
    };

    // Each car refers to one wheel and counts how many it has
    const cars = hip<ComponentsTable<Car>>({
      _type: 'components',
      _data: [
        {
          id: 'taycan',
          manufacturersRef: ref(porsche),
          wheelCount: 4,
          wheelsRef: ref(taycanFront), // no room for the rear wheels
        },
        {
          id: 'ex30',
          manufacturersRef: ref(volvo),
          wheelCount: 4,
          wheelsRef: ref(ex30Wheel),
        },
      ],
    });
    // #endregion wheel-count

    const [taycan] = cars._data;
    await writeGolden('taycan-wheel-count.json', taycan);

    expect(taycan.wheelsRef).toBe(ref(taycanFront));
    expect(await validate.run({ manufacturers, wheels, cars })).toEqual({});
  });

  it('then refers to each of the four wheels', async () => {
    // #region four-wheels
    type Car = {
      id: string;
      manufacturersRef: Ref;
      wheel0: Ref; // front left
      wheel1: Ref; // front right
      wheel2: Ref; // rear left
      wheel3: Ref; // rear right
    };

    // Each car refers to each of its four wheels
    const cars = hip<ComponentsTable<Car>>({
      _type: 'components',
      _data: [
        {
          id: 'taycan',
          manufacturersRef: ref(porsche),
          wheel0: ref(taycanFront),
          wheel1: ref(taycanFront),
          wheel2: ref(taycanRear),
          wheel3: ref(taycanRear),
        },
        {
          id: 'ex30',
          manufacturersRef: ref(volvo),
          wheel0: ref(ex30Wheel),
          wheel1: ref(ex30Wheel),
          wheel2: ref(ex30Wheel),
          wheel3: ref(ex30Wheel),
        },
      ],
    });
    // #endregion four-wheels

    const [taycan] = cars._data;
    await writeGolden('taycan-four-wheels.json', taycan);

    expect(taycan.wheel0).toBe(taycan.wheel1); // the same row of wheels
    expect(taycan.wheel2).toBe(ref(taycanRear));
    expect(await validate.run({ manufacturers, wheels, cars })).toEqual({});
  });

  it('finally refers to the wheels in an array', async () => {
    const [taycan] = cars._data;
    await writeGolden('taycan-wheel-array.json', taycan);

    expect(taycan.wheelsRef).toEqual([
      ref(taycanFront),
      ref(taycanFront),
      ref(taycanRear),
      ref(taycanRear),
    ]);

    // The order of the wheels is part of the content, and so of the hash
    const rearFirst = hip<Car>({
      id: 'taycan',
      manufacturersRef: ref(porsche),
      wheelsRef: [
        ref(taycanRear),
        ref(taycanRear),
        ref(taycanFront),
        ref(taycanFront),
      ],
    });
    expect(ref(rearFirst)).not.toBe(ref(taycan));
  });

  it('validates the car catalog', () => {
    expect(errors).toEqual({});
    expect(new BaseValidator().validateSync(carCatalog)).toEqual({
      hasErrors: false,
    });
  });

  it('lists the wheels of every car', async () => {
    await writeGolden('output.txt', output);

    expect(output).toBe(
      [
        'taycan by porsche',
        '  wheel 0: 20″ × 245 mm, by porsche',
        '  wheel 1: 20″ × 245 mm, by porsche',
        '  wheel 2: 20″ × 285 mm, by porsche',
        '  wheel 3: 20″ × 285 mm, by porsche',
        'ex30 by volvo',
        '  wheel 0: 19″ × 245 mm, by bbs',
        '  wheel 1: 19″ × 245 mm, by bbs',
        '  wheel 2: 19″ × 245 mm, by bbs',
        '  wheel 3: 19″ × 245 mm, by bbs',
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
    const brokenCars = structuredClone(cars);
    brokenCars._data[0].wheelsRef[3] = 'MISSING';
    hip(brokenCars, { updateExistingHashes: true, throwOnWrongHashes: false });

    expect(
      await validate.run({ manufacturers, wheels, cars: brokenCars }),
    ).toEqual({});
  });

  it('checks the references that the TableCfg declares', () => {
    expect(checkedCars._tableCfg).toBe(ref(carsCfg));
    expect(referenceErrors).toEqual({});
  });

  it('reports a reference in an array that points to no row', async () => {
    // #region unknown-wheel
    // A wheel that was never added to the wheels table
    const unknownWheel = hip<Wheel>({
      manufacturersRef: ref(porsche),
      diameter: 21,
      width: 305,
    });

    const brokenCars = hip<ComponentsTable<Car>>({
      _type: 'components',
      _tableCfg: ref(carsCfg),
      _data: [
        {
          id: 'taycan',
          manufacturersRef: ref(porsche),
          wheelsRef: [
            ref(taycanFront),
            ref(taycanFront),
            ref(taycanRear),
            ref(unknownWheel), // not in the wheels table
          ],
        },
      ],
    });

    const result = await validate.run({ ...checkedCatalog, cars: brokenCars });
    // #endregion unknown-wheel

    await writeGolden('unknown-wheel.json', result);
    expect(result).toMatchObject({
      base: {
        refsNotFound: {
          missingRefs: [
            {
              sourceTable: 'cars',
              sourceKey: 'wheelsRef',
              targetTable: 'wheels',
              targetItemHash: ref(unknownWheel),
            },
          ],
        },
      },
    });
  });
});
