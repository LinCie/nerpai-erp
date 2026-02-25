/** Product Variant — single orderable unit with its own SKU, price, stock */
export interface ProductVariant {
	id: string
	productId: string
	sku: string
	price: string
	stockQuantity: number
	isActive: boolean
	organizationId: string
	createdAt: Date
	updatedAt: Date
	deletedAt: Date | null
}
