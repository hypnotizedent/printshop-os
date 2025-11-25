function normalizeSS(style) {
  return {
    supplier: 'S&S',
    style_id:
      style.styleID || style.styleId || style.styleCode || style.style || style.itemSku ||
      style.itemNumber || style.styleNumber || style.sku || null,
    name: style.title || style.styleName || style.styleDescription || style.name || null,
    brand: style.brandName || 'S&S',
    category: style.baseCategory || style.categoryName || '',
    sizes: style.sizeList || [],
    colors: (style.colorList || []).map(c => ({
      name: c.name,
      hex: c.hex || null,
      sku: c.sku || null,
      stock: null,
      price: null,
    })),
    image_urls: style.mediaUrls || [],
    material: style.fabric || '',
    tags: style.features || [],
  };
}

function normalizeAS(product) {
  return {
    supplier: 'AS Colour',
    styleId: product.styleCode || product.id || null,
    name: product.styleName || product.name || null,
    brand: 'AS Colour',
    category: product.productType || '',
    sizes: product.sizeGuideURL ? ['One Size'] : [],
    colors: (product.colours || []).map(c => ({
      name: c.name,
      hex: c.hexCode || null,
      sku: null,
      stock: null,
      price: null
    })),
    imageUrls: product.websiteURL ? [product.websiteURL] : [],
    material: product.composition || '',
    tags: [product.shortDescription, product.fit, product.coreRange].filter(Boolean),
    description: product.description || null
  };
}

module.exports = { normalizeSS, normalizeAS };