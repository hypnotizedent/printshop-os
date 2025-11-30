
export interface ShopifyInstallation {
  id: string;
  shop_domain: string;
  access_token: string;
  installed_at: string;
  status: 'active' | 'uninstalled';
  settings?: any;
  created_at: string;
  updated_at: string;
}

export interface DesignSession {
  id: string;
  shop_domain: string;
  product_id?: string;
  customer_id?: string;
  garment_type: string;
  designs: any[];
  pricing: {
    basePrice: number;
    designComplexity: number;
    total: number;
  };
  status: 'active' | 'completed' | 'abandoned';
  created_at: string;
  updated_at: string;
}

export interface CustomOrder {
  id: string;
  session_id: string;
  shop_domain: string;
  customer_id?: string;
  shopify_order_id?: string;
  garment_type: string;
  designs: any[];
  pricing: {
    basePrice: number;
    designComplexity: number;
    total: number;
  };
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  production_files?: string[];
  created_at: string;
  updated_at: string;
}

export interface DesignAsset {
  id: string;
  session_id: string;
  file_url: string;
  file_type: string;
  file_size: number;
  created_at: string;
}
