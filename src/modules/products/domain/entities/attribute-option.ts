/** Attribute Option entity — specific value for an attribute */
export interface AttributeOption {
	id: string
	value: string
	attributeId: string
	organizationId: string
	createdAt: Date
	updatedAt: Date
	deletedAt: Date | null
}
