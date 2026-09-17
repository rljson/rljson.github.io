---
title: Routing
description: The Route class — addressing data paths in Rljson.
---

The `Route` class parses and builds the hierarchical data paths used
throughout the Rljson ecosystem.

```typescript
import { Route } from '@rljson/rljson';

// Parse a flat route string
const route = Route.fromFlat('/ingredients@A5d.../nutritionalValues');

route.top; // first segment: { tableKey: 'ingredients', ... }
route.root; // last segment: { tableKey: 'nutritionalValues' }
route.segment(0); // segment by index
route.flat; // serialized back to a string
```

A route segment can carry:

| Syntax              | Meaning                    |
| ------------------- | -------------------------- |
| `@hash`             | a reference to a row       |
| `(id1,id2)`         | a set of slice IDs         |
| `@timestamp:unique` | an InsertHistory reference |

Routes are what an [Insert](/guides/edit-protocol/) targets and what the
[sync protocol](/guides/sync-protocol/) names in its event names.
