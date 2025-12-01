/**
 * A normalized view of product variants that matches the legacy shape expected
 * by the configurator while still preserving richer Shopify data.
 */
export type NormalizedVariants = Record<string, { variants: any[] }>;

type NormalizationResult = {
  normalizedVariants: NormalizedVariants;
  format: 'legacy-object' | 'shopify-array' | 'unknown';
};

type ShopifyProduct = {
  handle?: string;
  title?: string;
  tags?: string[];
  options?: any[];
  product_id?: string;
  variants?: any[];
};

const addVariant = (
  target: NormalizedVariants,
  key: string,
  variant: any,
): void => {
  if (!target[key]) target[key] = { variants: [] };
  target[key].variants.push(variant);
};

const matches = (value: string | undefined, needle: string) =>
  value?.toLowerCase().includes(needle);

const hasTag = (tags: string[] | undefined, needle: string) =>
  (tags || []).some((tag) => tag.toLowerCase().includes(needle));

/**
 * Map a Shopify product to a legacy pack key.
 */
const mapProductToKey = (product: ShopifyProduct): string | null => {
  const handle = product.handle?.toLowerCase() || '';
  const title = product.title?.toLowerCase() || '';
  const tags = product.tags || [];

  if (matches(handle, '4-pack') || hasTag(tags, '4-pack')) return '4_pack_cladding';
  if (matches(handle, '2-pack') || hasTag(tags, '2-pack')) return '2_pack_cladding';
  if (matches(handle, 'side-panel') || hasTag(tags, 'side panel')) return 'side_panel_cladding';
  // Accept both "left-panel" and "end-panel-left" style handles/tags
  if (
    matches(handle, 'left-panel') ||
    matches(handle, 'end-panel-left') ||
    hasTag(tags, 'left panel') ||
    hasTag(tags, 'end panel left')
  )
    return 'left_panel_cladding';
  if (
    matches(handle, 'right-panel') ||
    matches(handle, 'end-panel-right') ||
    hasTag(tags, 'right panel') ||
    hasTag(tags, 'end panel right')
  )
    return 'right_panel_cladding';
  if (matches(handle, 'corner-connector') || hasTag(tags, 'corner connector')) return 'corner_connectors';
  if (matches(handle, 'straight-connector') || hasTag(tags, 'straight connector') || hasTag(tags, 'coupling'))
    return 'straight_couplings';
  // Generic connectors product (handles like "foodcube-connectors") should still map to connectors
  if (matches(handle, 'connector') || hasTag(tags, 'connector')) return 'connectors';

  return null;
};

/**
 * Normalize legacy object or Shopify array variant data into the
 * legacy-compatible structure used throughout the configurator.
 */
export const normalizeProductData = (input: any): NormalizationResult => {
  const isPlainObject = (value: any) =>
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value);
  const toKey = (value?: string | null) => (value || '').trim().toLowerCase();

  // Legacy: already in object map form
  if (isPlainObject(input) && !Array.isArray(input)) {
    console.log('[ProductSchema] Detected format: legacy-object');
    return { normalizedVariants: input as NormalizedVariants, format: 'legacy-object' };
  }

  const normalized: NormalizedVariants = {};

  // Shopify array
  if (Array.isArray(input)) {
    const ignoreHandles = new Set([
      'trellis',
      'foodcube-platforms',
      'foodcube-net-system',
      'premium-greenhouse-foodcube',
      'auto-watering-system',
      'foodcube-rafters',
      'foodcube-nets',
    ]);

    const mapCladdingVariant = (value: string | undefined | null): string | null => {
      const key = toKey(value);
      if (key.includes('fc 4pk')) return '4_pack_cladding';
      if (key === '2 pk' || key.includes('2 pk')) return '2_pack_cladding';
      if (key.includes('left end')) return 'left_panel_cladding';
      if (key.includes('right end')) return 'right_panel_cladding';
      if (key.includes('side panel')) return 'side_panel_cladding';
      if (key.includes('end panel')) {
        console.warn(`[ProductSchema] Unmapped variant type in foodcube-cladding: '${value ?? ''}'`);
        return null;
      }
      if (key.includes('half panel')) {
        console.warn(`[ProductSchema] Unmapped variant type in foodcube-cladding: '${value ?? ''}'`);
        return null;
      }
      if (key.includes('overlap')) {
        console.warn(`[ProductSchema] Unmapped variant type in foodcube-cladding: '${value ?? ''}'`);
        return null;
      }
      // Unknown type
      console.warn(`[ProductSchema] Unmapped variant type in foodcube-cladding: '${value ?? ''}'`);
      return null;
    };

    const mapConnectorVariant = (value: string | undefined | null): { key: string; type?: 'straight' | 'corner' } | null => {
      const key = toKey(value);
      if (key.includes('straight')) return { key: 'connectors', type: 'straight' };
      if (key.includes('corner')) return { key: 'connectors', type: 'corner' };
      if (key.includes('flexible')) {
        console.warn(`[ProductSchema] Unmapped variant type in foodcube-slim-connectors: '${value ?? ''}'`);
        return null;
      }
      console.warn(`[ProductSchema] Unmapped variant type in foodcube-slim-connectors: '${value ?? ''}'`);
      return null;
    };

    const products = (input as ShopifyProduct[]).filter(
      (product) => product?.handle && product?.variants?.length > 0
    );

    products.forEach((product) => {
      const handleKey = toKey(product.handle);

      // Skip empty or malformed products
      if (!handleKey || !product.variants || product.variants.length === 0) {
        return;
      }

      if (handleKey === 'foodcube-cladding') {
        product.variants.forEach((variant) => {
          const packKey = mapCladdingVariant(variant.option2);
          if (!packKey) return;

          const enriched = {
            id: variant.id,
            title: variant.title,
            price: variant.price,
            sku: variant.sku,
            available: variant.available,
            option1: variant.option1,
            option2: variant.option2,
            option3: variant.option3,
            product_handle: product.handle,
            product_title: product.title,
            product_tags: product.tags,
            product_options: product.options,
          };

          addVariant(normalized, packKey, enriched);
        });
        return;
      }

      if (handleKey === 'foodcube-slim-connectors') {
        product.variants.forEach((variant) => {
          const mapped = mapConnectorVariant(variant.option1);
          if (!mapped) return;

          const enriched = {
            id: variant.id,
            title: variant.title,
            price: variant.price,
            sku: variant.sku,
            available: variant.available,
            option1: variant.option1,
            option2: variant.option2,
            option3: variant.option3,
            product_handle: product.handle,
            product_title: product.title,
            product_tags: product.tags,
            product_options: product.options,
            type: mapped.type,
          };

          addVariant(normalized, mapped.key, enriched);
          // Preserve backward compatibility for connector subkeys
          if (mapped.type === 'straight') addVariant(normalized, 'straight_couplings', enriched);
          if (mapped.type === 'corner') addVariant(normalized, 'corner_connectors', enriched);
        });
        return;
      }

      // Fallback to legacy handle-based mapping
      const packKey = mapProductToKey(product);
      if (packKey) {
        (product.variants || []).forEach((variant) => {
          const enriched = {
            id: variant.id,
            title: variant.title,
            price: variant.price,
            sku: variant.sku,
            available: variant.available,
            option1: variant.option1,
            option2: variant.option2,
            option3: variant.option3,
            product_handle: product.handle,
            product_title: product.title,
            product_tags: product.tags,
            product_options: product.options,
          };
          addVariant(normalized, packKey, enriched);
        });
        return;
      }

      if (!ignoreHandles.has(handleKey)) {
        console.warn(
          '[ProductSchema] Unrecognized product – add tags/handle mapping:',
          product?.handle || product?.title || '[no title]',
        );
      }
    });

    console.log('[ProductSchema] Detected format: shopify-array');
    console.log('[ProductSchema] Normalized keys:', Object.keys(normalized));
    return { normalizedVariants: normalized, format: 'shopify-array' };
  }

  console.warn('[ProductSchema] Unknown product schema. Expected object map or Shopify array.');
  return { normalizedVariants: {}, format: 'unknown' };
};
