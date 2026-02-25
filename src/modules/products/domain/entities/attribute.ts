/** Attribute entity — named variant dimension scoped to an organization */
export interface Attribute {
	id: string
	name: string
	organizationId: string
	createdAt: Date
	updatedAt: Date
	deletedAt: Date | null
}
