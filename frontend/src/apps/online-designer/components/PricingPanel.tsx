
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, CreditCard } from "lucide-react";

interface PricingPanelProps {
  pricing: {
    basePrice: number;
    designComplexity: number;
    total: number;
  };
  selectedGarment: string;
}

export const PricingPanel = ({ pricing, selectedGarment }: PricingPanelProps) => {
  return (
    <Card className="shadow-lg border-0 sticky top-8">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Live Pricing</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 capitalize">{selectedGarment.replace('-', ' ')}</span>
            <span className="font-medium">${pricing.basePrice.toFixed(2)}</span>
          </div>
          
          {pricing.designComplexity > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Design Elements</span>
              <span className="font-medium">${pricing.designComplexity.toFixed(2)}</span>
            </div>
          )}
          
          <Separator />
          
          <div className="flex justify-between items-center text-lg font-semibold">
            <span>Total</span>
            <span className="text-blue-600">${pricing.total.toFixed(2)}</span>
          </div>
        </div>

        <div className="space-y-2">
          <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Add to Cart
          </Button>
          
          <Button variant="outline" className="w-full">
            <CreditCard className="h-4 w-4 mr-2" />
            Buy Now
          </Button>
        </div>

        <div className="pt-4 border-t">
          <h4 className="font-medium mb-2">Order Details</h4>
          <div className="space-y-1 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Quantity</span>
              <span>1</span>
            </div>
            <div className="flex justify-between">
              <span>Production Time</span>
              <span>3-5 days</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>Free</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
