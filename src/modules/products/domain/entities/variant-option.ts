/** Variant Option — immutable join linking variant to its defining attribute options */
export interface VariantOption {
	id: string
	productVariantId: string
	attributeOptionId: string
	productAttributeId: string
	organizationId: string
	createdAt: Date
	deletedAt: Date | null
}
