import { useState, useEffect } from "react";
import { strapi } from "@/lib/strapi";
import { DesignCanvas } from "./DesignCanvas";
import { GarmentSelector } from "./GarmentSelector";
import { DesignTools } from "./DesignTools";
import { PricingPanel } from "./PricingPanel";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Save, ShoppingCart } from "lucide-react";

interface CustomerDesignSessionProps {
  customerEmail?: string;
  customerId?: string;
  productId?: string;
}

export const CustomerDesignSession = ({ 
  customerEmail,
  customerId,
  productId
}: CustomerDesignSessionProps) => {
  const [selectedGarment, setSelectedGarment] = useState('t-shirt');
  const [designs, setDesigns] = useState<any[]>([]);
  const [pricing, setPricing] = useState({
    basePrice: 19.99,
    designComplexity: 0,
    total: 19.99
  });
  const [sessionDocumentId, setSessionDocumentId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    createDesignSession();
  }, []);

  const createDesignSession = async () => {
    try {
      const sessionData = {
        customerEmail: customerEmail || '',
        customerId: customerId || '',
        garmentType: selectedGarment,
        designs: [],
        pricing: pricing,
        status: 'active' as const,
        productId: productId || '',
      };

      const response = await strapi.createDesignSession(sessionData);
      setSessionDocumentId(response.data.documentId || null);
      toast.success("Design session started!");
    } catch (error) {
      console.error('Error creating design session:', error);
      toast.error("Failed to create design session");
    }
  };

  const handleDesignChange = async (newDesigns: any[]) => {
    setDesigns(newDesigns);
    
    // Calculate pricing based on design complexity
    const complexityPrice = newDesigns.length * 5;
    const newPricing = {
      basePrice: pricing.basePrice,
      designComplexity: complexityPrice,
      total: pricing.basePrice + complexityPrice
    };
    
    setPricing(newPricing);
    
    // Auto-save session
    if (sessionDocumentId) {
      await saveDesignSession(newDesigns, newPricing);
    }
  };

  const saveDesignSession = async (
    currentDesigns = designs, 
    currentPricing = pricing
  ) => {
    if (!sessionDocumentId) return;

    setSaving(true);
    try {
      await strapi.updateDesignSession(sessionDocumentId, {
        garmentType: selectedGarment,
        designs: currentDesigns,
        pricing: currentPricing,
      });
      toast.success("Design saved!");
    } catch (error) {
      console.error('Error saving design session:', error);
      toast.error("Failed to save design");
    } finally {
      setSaving(false);
    }
  };

  const handleAddToCart = async () => {
    if (!sessionDocumentId) return;

    try {
      // Create custom order in Strapi
      const orderData = {
        sessionId: sessionDocumentId,
        customerEmail: customerEmail || '',
        customerId: customerId || '',
        garmentType: selectedGarment,
        designs: designs,
        pricing: pricing,
        status: 'pending' as const,
      };

      await strapi.createCustomOrder(orderData);
      toast.success("Added to cart!");
      
      // Mark session as completed
      await strapi.updateDesignSession(sessionDocumentId, {
        status: 'completed',
      });
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error("Failed to add to cart");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="container mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Custom Design Studio</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => saveDesignSession()}
                  disabled={saving}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Design'}
                </Button>
                <Button onClick={handleAddToCart}>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Add to Cart
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Design Tools Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <DesignTools onDesignAdd={handleDesignChange} />
            <GarmentSelector 
              selectedGarment={selectedGarment}
              onGarmentChange={setSelectedGarment}
            />
          </div>

          {/* Main Canvas Area */}
          <div className="lg:col-span-2">
            <DesignCanvas 
              selectedGarment={selectedGarment}
              designs={designs}
              onDesignChange={handleDesignChange}
            />
          </div>

          {/* Pricing Panel */}
          <div className="lg:col-span-1">
            <PricingPanel pricing={pricing} selectedGarment={selectedGarment} />
          </div>
        </div>
      </div>
    </div>
  );
};
