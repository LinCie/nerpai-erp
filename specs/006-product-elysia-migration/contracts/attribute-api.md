# Contract: Attribute API

**Prefix**: `/api/products/attributes`
**Auth**: All routes require `{ auth: true }`.

---

## GET /attributes

List active attributes with their options for the current organization.

**Query Parameters**:
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| search | string | No | Filter by name |

**Response**:
| Status | Schema | Condition |
|--------|--------|-----------|
| 200 | `AttributeWithOptions[]` | Success |

**AttributeWithOptions shape**:
```json
{
  "id": "uuid",
  "name": "string",
  "organizationId": "uuid",
  "createdAt": "datetime",
  "updatedAt": "datetime",
  "options": [
    { "id": "uuid", "value": "string", "attributeId": "uuid" }
  ]
}
```

---

## GET /attributes/:id

Get a single attribute by ID with its options.

**Path Parameters**:
| Param | Type | Description |
|-------|------|-------------|
| id | uuid | Attribute ID |

**Response**:
| Status | Schema | Condition |
|--------|--------|-----------|
| 200 | `AttributeWithOptions` | Found |
| 404 | `{ error: string }` | Attribute not found |

---

## POST /attributes

Create a new attribute.

**Request Body**:
```json
{ "name": "string (1–255 chars, trimmed)" }
```

**Response**:
| Status | Schema | Condition |
|--------|--------|-----------|
| 200 | `Attribute` | Created |
| 400 | `{ error: string }` | Validation failure |

---

## PUT /attributes/:id

Update an existing attribute name.

**Path Parameters**:
| Param | Type | Description |
|-------|------|-------------|
| id | uuid | Attribute ID |

**Request Body**:
```json
{ "name": "string (1–255 chars, trimmed)" }
```

**Response**:
| Status | Schema | Condition |
|--------|--------|-----------|
| 200 | `Attribute` | Updated |
| 400 | `{ error: string }` | Validation failure |
| 404 | `{ error: string }` | Attribute not found |

---

## DELETE /attributes/:id

Soft-delete an attribute.

**Path Parameters**:
| Param | Type | Description |
|-------|------|-------------|
| id | uuid | Attribute ID |

**Response**:
| Status | Schema | Condition |
|--------|--------|-----------|
| 200 | `{ success: true }` | Soft-deleted |
| 404 | `{ error: string }` | Attribute not found |

---

## POST /attributes/:id/options

Create a new option for an attribute.

**Path Parameters**:
| Param | Type | Description |
|-------|------|-------------|
| id | uuid | Attribute ID (parent) |

**Request Body**:
```json
{ "value": "string (1–255 chars, trimmed)" }
```

**Response**:
| Status | Schema | Condition |
|--------|--------|-----------|
| 200 | `AttributeOption` | Created |
| 400 | `{ error: string }` | Validation failure |
| 404 | `{ error: string }` | Parent attribute not found |

---

## PUT /attributes/:attributeId/options/:id

Update an attribute option value.

**Path Parameters**:
| Param | Type | Description |
|-------|------|-------------|
| attributeId | uuid | Parent attribute ID |
| id | uuid | Option ID |

**Request Body**:
```json
{ "value": "string (1–255 chars, trimmed)" }
```

**Response**:
| Status | Schema | Condition |
|--------|--------|-----------|
| 200 | `AttributeOption` | Updated |
| 400 | `{ error: string }` | Validation failure |
| 404 | `{ error: string }` | Option not found |

---

## DELETE /attributes/:attributeId/options/:id

Delete an attribute option (hard delete if not in use).

**Path Parameters**:
| Param | Type | Description |
|-------|------|-------------|
| attributeId | uuid | Parent attribute ID |
| id | uuid | Option ID |

**Response**:
| Status | Schema | Condition |
|--------|--------|-----------|
| 200 | `{ success: true }` | Deleted |
| 404 | `{ error: string }` | Option not found |
| 409 | `{ error: string }` | Option in use by variants |
