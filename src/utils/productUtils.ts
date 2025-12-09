/**
 * Utility functions for handling product data with embedded subSkuFamily structure
 */

export interface SubSkuFamily {
  _id: string;
  subName?: string;
  subSkuCode?: string;
  images?: string[];
  videos?: string[];
  storageId?: any;
  ramId?: any;
  colorId?: any;
  subSkuSequence?: number;
  [key: string]: any;
}

export interface SkuFamily {
  _id: string;
  name?: string;
  code?: string;
  images?: string[];
  description?: string;
  subSkuFamilies?: SubSkuFamily[];
  [key: string]: any;
}

export interface Product {
  _id?: string;
  skuFamilyId?: string | SkuFamily;
  subSkuFamilyId?: string | SubSkuFamily;
  [key: string]: any;
}

/**
 * Extracts subSkuFamily from skuFamily.subSkuFamilies array based on subSkuFamilyId
 * @param product - Product object with skuFamilyId and subSkuFamilyId
 * @returns The matching subSkuFamily object or null
 */
export function getSubSkuFamily(product: Product): SubSkuFamily | null {
  if (!product) return null;

  // If subSkuFamilyId is already an object, return it
  if (product.subSkuFamilyId && typeof product.subSkuFamilyId === 'object') {
    return product.subSkuFamilyId as SubSkuFamily;
  }

  // If subSkuFamilyId is a string ID, try to find it in skuFamily.subSkuFamilies
  const subSkuFamilyId = product.subSkuFamilyId;
  if (!subSkuFamilyId || typeof subSkuFamilyId !== 'string') {
    return null;
  }

  const skuFamily = product.skuFamilyId;
  if (!skuFamily || typeof skuFamily !== 'object') {
    return null;
  }

  const subSkuFamilies = (skuFamily as SkuFamily).subSkuFamilies;
  if (!Array.isArray(subSkuFamilies) || subSkuFamilies.length === 0) {
    return null;
  }

  // Find the matching subSkuFamily by _id
  const found = subSkuFamilies.find(
    (sub) => sub._id?.toString() === subSkuFamilyId.toString()
  );

  return found || null;
}

/**
 * Gets the effective name from product (subSkuFamily > skuFamily > specification)
 */
export function getProductName(product: Product): string {
  const subSkuFamily = getSubSkuFamily(product);
  if (subSkuFamily?.subName) return subSkuFamily.subName;

  const skuFamily = product.skuFamilyId;
  if (skuFamily && typeof skuFamily === 'object' && (skuFamily as SkuFamily).name) {
    return (skuFamily as SkuFamily).name;
  }

  return product.specification || 'Product';
}

/**
 * Gets the effective code from product (subSkuFamily > skuFamily)
 */
export function getProductCode(product: Product): string {
  const subSkuFamily = getSubSkuFamily(product);
  if (subSkuFamily?.subSkuCode) return subSkuFamily.subSkuCode;

  const skuFamily = product.skuFamilyId;
  if (skuFamily && typeof skuFamily === 'object' && (skuFamily as SkuFamily).code) {
    return (skuFamily as SkuFamily).code;
  }

  return product.code || '';
}

/**
 * Gets images from product (subSkuFamily > skuFamily)
 */
export function getProductImages(product: Product): string[] {
  const images: string[] = [];

  const subSkuFamily = getSubSkuFamily(product);
  if (subSkuFamily?.images && Array.isArray(subSkuFamily.images)) {
    images.push(...subSkuFamily.images);
  }

  const skuFamily = product.skuFamilyId;
  if (skuFamily && typeof skuFamily === 'object') {
    const skuImages = (skuFamily as SkuFamily).images;
    if (Array.isArray(skuImages)) {
      images.push(...skuImages);
    }
  }

  return images;
}

/**
 * Gets the subSkuFamilyId as a string (for API calls)
 */
export function getSubSkuFamilyId(product: Product): string | null {
  if (!product) return null;

  // If it's already a string, return it
  if (typeof product.subSkuFamilyId === 'string') {
    return product.subSkuFamilyId;
  }

  // If it's an object, return its _id
  if (product.subSkuFamilyId && typeof product.subSkuFamilyId === 'object') {
    return (product.subSkuFamilyId as SubSkuFamily)._id || null;
  }

  // Try to extract from embedded array
  const subSkuFamily = getSubSkuFamily(product);
  return subSkuFamily?._id || null;
}

