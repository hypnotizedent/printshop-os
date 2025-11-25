/**
 * Example usage of supplier connectors
 * This file demonstrates how to use the connector classes
 */

import {
  createSSActivewearConnector,
  createASColourConnector,
  createSanMarConnector,
} from './index';

/**
 * Example 1: Fetch all products from S&S Activewear
 */
async function fetchSSProducts() {
  try {
    // Create connector (uses environment variables)
    const connector = createSSActivewearConnector();

    // Test connection first
    const isConnected = await connector.testConnection();
    if (!isConnected) {
      console.error('Failed to connect to S&S Activewear');
      return;
    }

    // Fetch all products
    const products = await connector.fetchProducts();
    console.log(`Fetched ${products.length} products from S&S Activewear`);

    // Log first product as example
    if (products.length > 0) {
      console.log('Example product:', JSON.stringify(products[0], null, 2));
    }

    return products;
  } catch (error) {
    console.error('Error fetching S&S products:', error);
    throw error;
  }
}

/**
 * Example 2: Fetch a specific product from AS Colour
 */
async function fetchASProduct(styleCode: string) {
  try {
    const connector = createASColourConnector();

    // Fetch single product
    const product = await connector.fetchProduct(styleCode);

    if (product) {
      console.log('Product found:', product.name);
      console.log('Available colors:', product.colors.map(c => c.name).join(', '));
      console.log('Available sizes:', product.sizes.join(', '));
    } else {
      console.log(`Product ${styleCode} not found`);
    }

    return product;
  } catch (error) {
    console.error('Error fetching AS Colour product:', error);
    throw error;
  }
}

/**
 * Example 3: Fetch and filter products from SanMar
 */
async function fetchSanMarByBrand(brand: string) {
  try {
    const connector = createSanMarConnector();

    // Fetch all products
    const products = await connector.fetchProducts();

    // Filter by brand
    const filteredProducts = products.filter(
      p => p.brand.toLowerCase() === brand.toLowerCase()
    );

    console.log(
      `Found ${filteredProducts.length} products from ${brand} at SanMar`
    );

    return filteredProducts;
  } catch (error) {
    console.error('Error fetching SanMar products:', error);
    throw error;
  }
}

/**
 * Example 4: Fetch products from all suppliers and merge
 */
async function fetchAllSupplierProducts() {
  try {
    console.log('Fetching products from all suppliers...');

    // Fetch from all suppliers in parallel
    const [ssProducts, asProducts, smProducts] = await Promise.allSettled([
      createSSActivewearConnector().fetchProducts(),
      createASColourConnector().fetchProducts(),
      createSanMarConnector().fetchProducts(),
    ]);

    // Collect successful results
    const allProducts = [
      ...(ssProducts.status === 'fulfilled' ? ssProducts.value : []),
      ...(asProducts.status === 'fulfilled' ? asProducts.value : []),
      ...(smProducts.status === 'fulfilled' ? smProducts.value : []),
    ];

    // Log errors if any
    if (ssProducts.status === 'rejected') {
      console.error('S&S error:', ssProducts.reason);
    }
    if (asProducts.status === 'rejected') {
      console.error('AS Colour error:', asProducts.reason);
    }
    if (smProducts.status === 'rejected') {
      console.error('SanMar error:', smProducts.reason);
    }

    console.log(`Total products from all suppliers: ${allProducts.length}`);

    // Group by supplier
    const bySupplier = allProducts.reduce((acc, product) => {
      acc[product.supplier] = (acc[product.supplier] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('Products per supplier:', bySupplier);

    return allProducts;
  } catch (error) {
    console.error('Error fetching from all suppliers:', error);
    throw error;
  }
}

/**
 * Example 5: Find products with specific features
 */
async function findProductsWithFeatures(features: string[]) {
  try {
    // Fetch from all suppliers
    const allProducts = await fetchAllSupplierProducts();

    // Filter by features
    const matchingProducts = allProducts.filter(product => {
      const productTags = (product.tags || []).map(t => t.toLowerCase());
      return features.some(feature =>
        productTags.some(tag => tag.includes(feature.toLowerCase()))
      );
    });

    console.log(
      `Found ${matchingProducts.length} products matching features: ${features.join(', ')}`
    );

    return matchingProducts;
  } catch (error) {
    console.error('Error finding products:', error);
    throw error;
  }
}

/**
 * Example 6: Custom connector configuration
 */
import { SSActivewearConnector } from './ss-activewear';

async function useCustomConfig() {
  // Create connector with custom configuration
  const connector = new SSActivewearConnector({
    baseUrl: 'https://api.ssactivewear.com/v2',
    auth: {
      username: 'custom-username',
      password: 'custom-password',
    },
    timeout: 60000, // 60 seconds
    retryConfig: {
      maxRetries: 5,
      initialDelayMs: 2000,
      maxDelayMs: 30000,
      backoffMultiplier: 3,
    },
  });

  const products = await connector.fetchProducts();
  return products;
}

// Export examples for use in other files
export {
  fetchSSProducts,
  fetchASProduct,
  fetchSanMarByBrand,
  fetchAllSupplierProducts,
  findProductsWithFeatures,
  useCustomConfig,
};

// If running directly, execute an example
if (require.main === module) {
  (async () => {
    try {
      // Run example - fetch products from all suppliers
      await fetchAllSupplierProducts();
    } catch (error) {
      console.error('Example failed:', error);
      process.exit(1);
    }
  })();
}
