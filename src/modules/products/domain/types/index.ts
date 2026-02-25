export type { Product } from "../entities/product";
export type { Attribute } from "../entities/attribute";
export type { AttributeOption } from "../entities/attribute-option";
export type { ProductAttribute } from "../entities/product-attribute";
export type { ProductVariant } from "../entities/product-variant";
export type { VariantOption } from "../entities/variant-option";

import type { Attribute } from "../entities/attribute";
import type { AttributeOption } from "../entities/attribute-option";
import type { ProductAttribute } from "../entities/product-attribute";
import type { ProductVariant } from "../entities/product-variant";

export interface AttributeWithOptions {
	attribute: Attribute;
	options: AttributeOption[];
}

export interface VariantWithOptions {
	variant: ProductVariant;
	options: Array<{
		option: AttributeOption;
		productAttribute: ProductAttribute;
	}>;
}

export interface ProductWithVariants {
	productId: string;
	productName: string;
	attributes: Array<{
		productAttribute: ProductAttribute;
		attribute: Attribute;
		options: AttributeOption[];
	}>;
	variants: VariantWithOptions[];
}

