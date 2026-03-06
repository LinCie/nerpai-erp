# Contract: Product API

**Prefix**: `/api/products`
**Auth**: All routes require `{ auth: true }` — resolved context provides `user`, `session`, `organization`.

---

## GET /products

List active products for the current organization.

**Query Parameters**:
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| search | string | No | Filter by name (ILIKE) |

**Response**:
| Status | Schema | Condition |
|--------|--------|-----------|
| 200 | `Product[]` | Success |

**Product shape**:
```json
{
  "id": "uuid",
  "name": "string",
  "description": "string | null",
  "organizationId": "uuid",
  "createdAt": "datetime",
  "updatedAt": "datetime"
}
```

---

## GET /products/trash

List soft-deleted products for the current organization.

**Response**:
| Status | Schema | Condition |
|--------|--------|-----------|
| 200 | `Product[]` | Success |

---

## GET /products/:id

Get a single product by ID.

**Path Parameters**:
| Param | Type | Description |
|-------|------|-------------|
| id | uuid | Product ID |

**Response**:
| Status | Schema | Condition |
|--------|--------|-----------|
| 200 | `Product` | Found |
| 404 | `{ error: string }` | Product not found or wrong org |

---

## POST /products

Create a new product.

**Request Body**:
```json
{ "name": "string (1–255 chars, trimmed)" }
```

**Response**:
| Status | Schema | Condition |
|--------|--------|-----------|
| 200 | `Product` | Created successfully |
| 400 | `{ error: string }` | Validation failure (empty name, too long) |

---

## PUT /products/:id

Update an existing product.

**Path Parameters**:
| Param | Type | Description |
|-------|------|-------------|
| id | uuid | Product ID |

**Request Body**:
```json
{ "name": "string (1–255 chars, trimmed)" }
```

**Response**:
| Status | Schema | Condition |
|--------|--------|-----------|
| 200 | `Product` | Updated successfully |
| 400 | `{ error: string }` | Validation failure |
| 404 | `{ error: string }` | Product not found |

---

## DELETE /products/:id

Soft-delete a product.

**Path Parameters**:
| Param | Type | Description |
|-------|------|-------------|
| id | uuid | Product ID |

**Response**:
| Status | Schema | Condition |
|--------|--------|-----------|
| 200 | `{ success: true }` | Soft-deleted |
| 404 | `{ error: string }` | Product not found |

---

## POST /products/:id/restore

Restore a soft-deleted product.

**Path Parameters**:
| Param | Type | Description |
|-------|------|-------------|
| id | uuid | Product ID |

**Response**:
| Status | Schema | Condition |
|--------|--------|-----------|
| 200 | `{ success: true }` | Restored |
| 404 | `{ error: string }` | Product not found |
