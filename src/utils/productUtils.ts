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
  videos?: string[];
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
 * @param product - Product object with skuFamilyId and optionally subSkuFamilyId
 * @returns The matching subSkuFamily object or null
 */
export function getSubSkuFamily(product: Product): SubSkuFamily | null {
  if (!product) return null;

  // If subSkuFamilyId is already an object, return it
  if (product.subSkuFamilyId && typeof product.subSkuFamilyId === 'object') {
    return product.subSkuFamilyId as SubSkuFamily;
  }

  const skuFamily = product.skuFamilyId;
  if (!skuFamily || typeof skuFamily !== 'object') {
    return null;
  }

  const subSkuFamilies = (skuFamily as SkuFamily).subSkuFamilies;
  if (!Array.isArray(subSkuFamilies) || subSkuFamilies.length === 0) {
    return null;
  }

  // If subSkuFamilyId is a string ID, try to find it in skuFamily.subSkuFamilies
  const subSkuFamilyId = product.subSkuFamilyId;
  if (subSkuFamilyId) {
    // Find the matching subSkuFamily by _id
    const found = subSkuFamilies.find(
      (sub) => sub._id?.toString() === subSkuFamilyId.toString()
    );
    if (found) return found;
  }

  // If no subSkuFamilyId provided or not found, return null
  // (In the future, could match by product attributes like color, ram, storage)
  return null;
}

/**
 * Gets the effective name from product (subSkuFamily > skuFamily > specification)
 */
export function getProductName(product: Product): string {
  // const subSkuFamily = getSubSkuFamily(product);
  // if (subSkuFamily?.subName) return subSkuFamily.subName;

  const skuFamily = product.skuFamilyId;
  if (skuFamily && typeof skuFamily === 'object' && (skuFamily as SkuFamily).name) {
    const spec = product.specification.toString() !==skuFamily.name?.toString() ? product.specification.toString(): "";
    const name = (skuFamily as SkuFamily).name +" "+ spec;
    return name;
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
    return (skuFamily as SkuFamily).code as string;
  }

  return product.code || '';
}

/**
 * Gets images from product with priority:
 * 1. Product images (product.images) - first preference
 * 2. SubSkuFamily images (filtered by subSkuFamilyId) - second preference
 * 3. SkuFamily images - fallback
 * 4. Dummy image - if none available
 */
export function getProductImages(product: Product): string[] {
  // Priority 1: Product's own images
  if (product.images && Array.isArray(product.images) && product.images.length > 0) {
    const validImages = product.images.filter((img: string) => img && String(img).trim() !== '');
    if (validImages.length > 0) {
      return validImages;
    }
  }

  // Priority 2: SubSkuFamily images (filtered by subSkuFamilyId matching product.subSkuFamilyId)
  const subSkuFamily = getSubSkuFamily(product);
  if (subSkuFamily?.images && Array.isArray(subSkuFamily.images) && subSkuFamily.images.length > 0) {
    const validImages = subSkuFamily.images.filter((img: string) => img && String(img).trim() !== '');
    if (validImages.length > 0) {
      return validImages;
    }
  }

  // Priority 3: SkuFamily images (fallback)
  const skuFamily = product.skuFamilyId;
  if (skuFamily && typeof skuFamily === 'object') {
    const skuImages = (skuFamily as SkuFamily).images;
    if (Array.isArray(skuImages) && skuImages.length > 0) {
      const validImages = skuImages.filter((img: string) => img && String(img).trim() !== '');
      if (validImages.length > 0) {
        return validImages;
      }
    }
  }

  // Priority 4: Return empty array (dummy image will be handled by component)
  return [];
}

/**
 * Gets videos from product with priority:
 * 1. Product videos (product.videos) - first preference
 * 2. SubSkuFamily videos (filtered by subSkuFamilyId) - second preference
 * 3. SkuFamily videos - fallback
 */
export function getProductVideos(product: Product): string[] {
  // Priority 1: Product's own videos
  if ((product as any).videos && Array.isArray((product as any).videos) && (product as any).videos.length > 0) {
    const validVideos = (product as any).videos.filter((vid: string) => vid && String(vid).trim() !== '');
    if (validVideos.length > 0) {
      return validVideos;
    }
  }

  // Priority 2: SubSkuFamily videos (filtered by subSkuFamilyId matching product.subSkuFamilyId)
  const subSkuFamily = getSubSkuFamily(product);
  if (subSkuFamily?.videos && Array.isArray(subSkuFamily.videos) && subSkuFamily.videos.length > 0) {
    const validVideos = subSkuFamily.videos.filter((vid: string) => vid && String(vid).trim() !== '');
    if (validVideos.length > 0) {
      return validVideos;
    }
  }

  // Priority 3: SkuFamily videos (fallback)
  const skuFamily = product.skuFamilyId;
  if (skuFamily && typeof skuFamily === 'object') {
    const skuVideos = (skuFamily as SkuFamily).videos;
    if (Array.isArray(skuVideos) && skuVideos.length > 0) {
      const validVideos = skuVideos.filter((vid: string) => vid && String(vid).trim() !== '');
      if (validVideos.length > 0) {
        return validVideos;
      }
    }
  }

  // Return empty array if no videos found
  return [];
}

/**
 * Gets the subSkuFamilyId as a string (for API calls)
 * Since subSkuFamily is now inside skuFamily.subSkuFamilies array,
 * this function extracts the ID from the product or finds it in the array
 */
export function getSubSkuFamilyId(product: Product): string | null {
  if (!product) return null;

  // If it's already a string, return it (this is the ID reference)
  if (typeof product.subSkuFamilyId === 'string') {
    return product.subSkuFamilyId;
  }

  // If it's an object, return its _id
  if (product.subSkuFamilyId && typeof product.subSkuFamilyId === 'object') {
    return (product.subSkuFamilyId as SubSkuFamily)._id || null;
  }

  // Try to extract from embedded array in skuFamily
  // This handles the case where subSkuFamilyId is stored as a reference ID
  // and we need to find the matching subSkuFamily in skuFamily.subSkuFamilies
  const subSkuFamily = getSubSkuFamily(product);
  if (subSkuFamily?._id) {
    return subSkuFamily._id;
  }

  // If product has subSkuFamilyId as a string but not found in array, return it anyway
  // (for backward compatibility and API calls)
  if (product.subSkuFamilyId && typeof product.subSkuFamilyId === 'string') {
    return product.subSkuFamilyId;
  }

  return null;
}

