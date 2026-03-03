// src/modules/orders/domain/entities/order-item.ts

/** Order Item — a snapshotted product/variant entry within an order */
export interface OrderItem {
  id: string; // UUID v7
  orderId: string; // FK → order.id
  productId: string | null; // FK → product.id (nullable — traceability)
  productVariantId: string | null; // FK → product_variant.id (nullable — traceability)
  productName: string; // Snapshotted at creation time
  sku: string; // Snapshotted at creation time
  unitPrice: string; // Snapshotted at creation time (NUMERIC as string)
  quantity: number; // > 0
  subtotal: string; // = quantity × unitPrice (NUMERIC as string)
  createdAt: Date;
  deletedAt: Date | null; // Constitution IX compliance
}
