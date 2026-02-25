/** Product Attribute — join record linking product to attribute with display order */
export interface ProductAttribute {
	id: string
	productId: string
	attributeId: string
	displayOrder: number
	organizationId: string
	createdAt: Date
	updatedAt: Date
	deletedAt: Date | null
}
