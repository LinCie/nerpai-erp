# Contract: Variant API

**Prefix**: `/api/products/:productId/variants`
**Auth**: All routes require `{ auth: true }`.

---

## GET /:productId/variants

List variants for a product.

**Path Parameters**:
| Param | Type | Description |
|-------|------|-------------|
| productId | uuid | Product ID |

**Response**:
| Status | Schema | Condition |
|--------|--------|-----------|
| 200 | `Variant[]` | Success (may include variant options) |

**Variant shape**:
```json
{
  "id": "uuid",
  "productId": "uuid",
  "sku": "string",
  "price": "number",
  "isActive": "boolean",
  "organizationId": "uuid",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

---

## POST /:productId/attributes

Assign an attribute to a product.

**Path Parameters**:
| Param | Type | Description |
|-------|------|-------------|
| productId | uuid | Product ID |

**Request Body**:
```json
{ "attributeId": "uuid" }
```

**Response**:
| Status | Schema | Condition |
|--------|--------|-----------|
| 200 | `{ id: uuid, displayOrder: number }` | Assigned |
| 400 | `{ error: string }` | Validation failure |
| 404 | `{ error: string }` | Product or attribute not found |
| 409 | `{ error: string }` | Attribute already assigned |

---

## DELETE /:productId/attributes/:attributeId

Remove an attribute from a product.

**Path Parameters**:
| Param | Type | Description |
|-------|------|-------------|
| productId | uuid | Product ID |
| attributeId | uuid | Attribute ID |

**Query Parameters**:
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| confirmed | boolean | No | Confirm deactivation of affected variants |

**Response**:
| Status | Schema | Condition |
|--------|--------|-----------|
| 200 | `{ deactivatedCount: number }` | Removed + variants deactivated |
| 400 | `{ error: string }` | Validation failure |
| 404 | `{ error: string }` | Product-attribute assignment not found |
| 409 | `{ needsConfirmation: true, affectedCount: number, message: string }` | Confirmation required (variants will be affected) |

---

## PUT /:productId/attributes/reorder

Reorder product attributes.

**Path Parameters**:
| Param | Type | Description |
|-------|------|-------------|
| productId | uuid | Product ID |

**Request Body**:
```json
{ "orderedAttributeIds": ["uuid", "uuid", ...] }
```

**Response**:
| Status | Schema | Condition |
|--------|--------|-----------|
| 200 | `{ success: true }` | Reordered |
| 400 | `{ error: string }` | Validation failure or attribute list mismatch |

---

## POST /:productId/variants/generate

Generate variant combinations from selected attribute options.

**Path Parameters**:
| Param | Type | Description |
|-------|------|-------------|
| productId | uuid | Product ID |

**Request Body**:
```json
{
  "selections": { "<attributeId>": ["<optionId>", ...], ... },
  "onlyNew": false
}
```

**Response**:
| Status | Schema | Condition |
|--------|--------|-----------|
| 200 | `{ created: number, variants: [{ id, sku }], skipped?: number }` | Generated |
| 400 | `{ error: string }` | Validation failure or empty selections |
| 404 | `{ error: string }` | Product not found |

---

## PUT /:productId/variants/:id

Update a variant (SKU, price).

**Path Parameters**:
| Param | Type | Description |
|-------|------|-------------|
| productId | uuid | Product ID |
| id | uuid | Variant ID |

**Request Body**:
```json
{
  "sku": "string (optional, 1–255 chars)",
  "price": "number (optional, >= 0)"
}
```

**Response**:
| Status | Schema | Condition |
|--------|--------|-----------|
| 200 | `{ id, sku, price }` | Updated |
| 400 | `{ error: string }` | Validation failure |
| 404 | `{ error: string }` | Variant not found |
| 409 | `{ error: string }` | SKU conflict |

---

## PATCH /:productId/variants/:id/active

Toggle variant active status.

**Path Parameters**:
| Param | Type | Description |
|-------|------|-------------|
| productId | uuid | Product ID |
| id | uuid | Variant ID |

**Request Body**:
```json
{ "isActive": true }
```

**Response**:
| Status | Schema | Condition |
|--------|--------|-----------|
| 200 | `{ success: true }` | Toggled |
| 404 | `{ error: string }` | Variant not found |

---

## DELETE /:productId/variants/:id

Soft-delete a variant.

**Path Parameters**:
| Param | Type | Description |
|-------|------|-------------|
| productId | uuid | Product ID |
| id | uuid | Variant ID |

**Response**:
| Status | Schema | Condition |
|--------|--------|-----------|
| 200 | `{ success: true }` | Soft-deleted |
| 404 | `{ error: string }` | Variant not found |

---

## GET /:productId/variants/combination-keys

Get existing variant combination keys for a product (used by the variant generation matrix to identify already-generated combinations).

**Path Parameters**:
| Param | Type | Description |
|-------|------|-------------|
| productId | uuid | Product ID |

**Response**:
| Status | Schema | Condition |
|--------|--------|-----------|
| 200 | `{ keys: string[] }` | Success |

---

## POST /:productId/variants/check-sku

Check if a SKU is available (not used by another variant in the same org).

**Path Parameters**:
| Param | Type | Description |
|-------|------|-------------|
| productId | uuid | Product ID |

**Request Body**:
```json
{
  "sku": "string",
  "excludeVariantId": "uuid (optional, to exclude current variant)"
}
```

**Response**:
| Status | Schema | Condition |
|--------|--------|-----------|
| 200 | `{ available: boolean }` | Success |
| 400 | `{ error: string }` | Validation failure |
