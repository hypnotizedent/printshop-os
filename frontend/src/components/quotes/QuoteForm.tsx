/**
 * QuoteForm Component
 * Create new quotes with garment selection, quantities, colors, and print locations.
 * Connects to job-estimator service for real-time pricing.
 */
import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash, Calculator, PaperPlaneTilt, FloppyDisk } from '@phosphor-icons/react';
import { toast } from 'sonner';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:1337';

// Print categories
const PRINT_CATEGORIES = [
  'Screen Printing',
  'DTG (Direct to Garment)',
  'Embroidery',
  'Heat Transfer',
  'Sublimation',
  'Vinyl',
] as const;

// Common garment types
const GARMENT_TYPES = [
  'T-Shirt',
  'Hoodie',
  'Polo',
  'Tank Top',
  'Long Sleeve',
  'Crewneck Sweatshirt',
  'Jacket',
  'Hat',
  'Bag',
  'Other',
] as const;

// Standard sizes
const SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'] as const;

// Print locations
const PRINT_LOCATIONS = [
  'Front Center',
  'Front Left Chest',
  'Front Right Chest',
  'Full Front',
  'Back Center',
  'Back Neck',
  'Full Back',
  'Left Sleeve',
  'Right Sleeve',
  'Both Sleeves',
] as const;

interface LineItem {
  id: string;
  garmentType: string;
  styleNumber: string;
  color: string;
  category: string;
  sizes: Record<string, number>;
  printLocations: string[];
  colors: number; // Number of ink colors
  unitPrice: number;
}

interface QuoteFormData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  company: string;
  dueDate: string;
  notes: string;
  lineItems: LineItem[];
}

const createEmptyLineItem = (): LineItem => ({
  id: crypto.randomUUID(),
  garmentType: '',
  styleNumber: '',
  color: '',
  category: 'Screen Printing',
  sizes: {},
  printLocations: [],
  colors: 1,
  unitPrice: 0,
});

export function QuoteForm() {
  const [formData, setFormData] = useState<QuoteFormData>({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    company: '',
    dueDate: '',
    notes: '',
    lineItems: [createEmptyLineItem()],
  });
  
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [estimatedTotal, setEstimatedTotal] = useState<number | null>(null);

  const updateLineItem = useCallback((id: string, updates: Partial<LineItem>) => {
    setFormData(prev => ({
      ...prev,
      lineItems: prev.lineItems.map(item =>
        item.id === id ? { ...item, ...updates } : item
      ),
    }));
    setEstimatedTotal(null); // Reset estimate when items change
  }, []);

  const addLineItem = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      lineItems: [...prev.lineItems, createEmptyLineItem()],
    }));
  }, []);

  const removeLineItem = useCallback((id: string) => {
    setFormData(prev => ({
      ...prev,
      lineItems: prev.lineItems.filter(item => item.id !== id),
    }));
  }, []);

  const updateSize = useCallback((itemId: string, size: string, quantity: number) => {
    setFormData(prev => ({
      ...prev,
      lineItems: prev.lineItems.map(item => {
        if (item.id !== itemId) return item;
        const newSizes = { ...item.sizes };
        if (quantity > 0) {
          newSizes[size] = quantity;
        } else {
          delete newSizes[size];
        }
        return { ...item, sizes: newSizes };
      }),
    }));
    setEstimatedTotal(null);
  }, []);

  const togglePrintLocation = useCallback((itemId: string, location: string) => {
    setFormData(prev => ({
      ...prev,
      lineItems: prev.lineItems.map(item => {
        if (item.id !== itemId) return item;
        const hasLocation = item.printLocations.includes(location);
        return {
          ...item,
          printLocations: hasLocation
            ? item.printLocations.filter(l => l !== location)
            : [...item.printLocations, location],
        };
      }),
    }));
    setEstimatedTotal(null);
  }, []);

  const getTotalQuantity = (item: LineItem) => {
    return Object.values(item.sizes).reduce((sum, qty) => sum + qty, 0);
  };

  const calculateEstimate = async () => {
    setIsCalculating(true);
    try {
      // Calculate based on line items
      // This would connect to job-estimator service in production
      let total = 0;
      
      for (const item of formData.lineItems) {
        const qty = getTotalQuantity(item);
        if (qty === 0) continue;
        
        // Base pricing logic (simplified - would come from job-estimator)
        let basePrice = 0;
        switch (item.category) {
          case 'Screen Printing':
            basePrice = 8 + (item.colors * 1.5); // Base + per color
            break;
          case 'DTG (Direct to Garment)':
            basePrice = 15;
            break;
          case 'Embroidery':
            basePrice = 12 + (item.printLocations.length * 3);
            break;
          case 'Heat Transfer':
            basePrice = 10;
            break;
          case 'Sublimation':
            basePrice = 18;
            break;
          case 'Vinyl':
            basePrice = 8;
            break;
          default:
            basePrice = 10;
        }
        
        // Location multiplier
        const locationMultiplier = 1 + (item.printLocations.length - 1) * 0.3;
        
        // Quantity discount
        let qtyDiscount = 1;
        if (qty >= 144) qtyDiscount = 0.7;
        else if (qty >= 72) qtyDiscount = 0.8;
        else if (qty >= 48) qtyDiscount = 0.85;
        else if (qty >= 24) qtyDiscount = 0.9;
        else if (qty >= 12) qtyDiscount = 0.95;
        
        const itemTotal = basePrice * locationMultiplier * qtyDiscount * qty;
        total += itemTotal;
        
        // Update unit price on item
        updateLineItem(item.id, { unitPrice: itemTotal / qty });
      }
      
      setEstimatedTotal(total);
      toast.success('Estimate calculated!', {
        description: `Total: $${total.toFixed(2)}`,
      });
    } catch (error) {
      toast.error('Failed to calculate estimate');
      console.error(error);
    } finally {
      setIsCalculating(false);
    }
  };

  const saveQuote = async (sendToCustomer = false) => {
    if (!formData.customerName || !formData.customerEmail) {
      toast.error('Please fill in customer name and email');
      return;
    }
    
    if (formData.lineItems.every(item => getTotalQuantity(item) === 0)) {
      toast.error('Please add at least one item with quantities');
      return;
    }

    setIsSaving(true);
    try {
      // Format items for Strapi
      const items = formData.lineItems
        .filter(item => getTotalQuantity(item) > 0)
        .map(item => ({
          description: `${item.garmentType}${item.styleNumber ? ` (${item.styleNumber})` : ''}`,
          styleNumber: item.styleNumber,
          color: item.color,
          category: item.category,
          quantity: getTotalQuantity(item),
          unitPrice: item.unitPrice,
          sizes: item.sizes,
          printLocations: item.printLocations,
          inkColors: item.colors,
        }));

      // Generate quote number
      const quoteNumber = `Q-${Date.now().toString(36).toUpperCase()}`;
      
      // Create order in Strapi with QUOTE status
      const response = await fetch(`${API_BASE}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: {
            orderNumber: quoteNumber,
            status: sendToCustomer ? 'QUOTE_SENT' : 'QUOTE',
            totalAmount: estimatedTotal || 0,
            dueDate: formData.dueDate || null,
            notes: formData.notes,
            items: items,
            // Customer info stored in notes until linked
            customerNotes: JSON.stringify({
              name: formData.customerName,
              email: formData.customerEmail,
              phone: formData.customerPhone,
              company: formData.company,
            }),
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save quote');
      }

      const result = await response.json();
      
      toast.success(sendToCustomer ? 'Quote sent to customer!' : 'Quote saved as draft!', {
        description: `Quote #${quoteNumber}`,
      });
      
      // Reset form
      setFormData({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        company: '',
        dueDate: '',
        notes: '',
        lineItems: [createEmptyLineItem()],
      });
      setEstimatedTotal(null);
      
    } catch (error) {
      toast.error('Failed to save quote');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Create Quote</h1>
          <p className="text-muted-foreground">Build a quote for your customer</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={calculateEstimate}
            disabled={isCalculating}
          >
            <Calculator className="mr-2" size={16} />
            {isCalculating ? 'Calculating...' : 'Calculate'}
          </Button>
          <Button
            variant="outline"
            onClick={() => saveQuote(false)}
            disabled={isSaving}
          >
            <FloppyDisk className="mr-2" size={16} />
            Save Draft
          </Button>
          <Button
            onClick={() => saveQuote(true)}
            disabled={isSaving || estimatedTotal === null}
          >
            <PaperPlaneTilt className="mr-2" size={16} />
            Send Quote
          </Button>
        </div>
      </div>

      {/* Customer Info */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="customerName">Name *</Label>
            <Input
              id="customerName"
              value={formData.customerName}
              onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
              placeholder="John Doe"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customerEmail">Email *</Label>
            <Input
              id="customerEmail"
              type="email"
              value={formData.customerEmail}
              onChange={(e) => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
              placeholder="john@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customerPhone">Phone</Label>
            <Input
              id="customerPhone"
              value={formData.customerPhone}
              onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
              placeholder="(555) 123-4567"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <Input
              id="company"
              value={formData.company}
              onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
              placeholder="Acme Inc."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Line Items</h2>
          <Button variant="outline" size="sm" onClick={addLineItem}>
            <Plus className="mr-2" size={16} />
            Add Item
          </Button>
        </div>

        {formData.lineItems.map((item, index) => (
          <Card key={item.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Item {index + 1}</CardTitle>
                {formData.lineItems.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLineItem(item.id)}
                  >
                    <Trash size={16} className="text-destructive" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Garment Selection */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Garment Type</Label>
                  <Select
                    value={item.garmentType}
                    onValueChange={(v) => updateLineItem(item.id, { garmentType: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {GARMENT_TYPES.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Style Number</Label>
                  <Input
                    value={item.styleNumber}
                    onChange={(e) => updateLineItem(item.id, { styleNumber: e.target.value })}
                    placeholder="e.g. G500, PC54"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Color</Label>
                  <Input
                    value={item.color}
                    onChange={(e) => updateLineItem(item.id, { color: e.target.value })}
                    placeholder="e.g. Black, Navy"
                  />
                </div>
              </div>

              {/* Print Category */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Print Category</Label>
                  <Select
                    value={item.category}
                    onValueChange={(v) => updateLineItem(item.id, { category: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRINT_CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Number of Ink Colors</Label>
                  <Input
                    type="number"
                    min="1"
                    max="12"
                    value={item.colors}
                    onChange={(e) => updateLineItem(item.id, { colors: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>

              {/* Size Breakdown */}
              <div className="space-y-2">
                <Label>Size Breakdown</Label>
                <div className="grid grid-cols-9 gap-2">
                  {SIZES.map(size => (
                    <div key={size} className="space-y-1">
                      <Label className="text-xs text-center block">{size}</Label>
                      <Input
                        type="number"
                        min="0"
                        className="text-center px-1"
                        value={item.sizes[size] || ''}
                        onChange={(e) => updateSize(item.id, size, parseInt(e.target.value) || 0)}
                        placeholder="0"
                      />
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  Total: {getTotalQuantity(item)} pieces
                </p>
              </div>

              {/* Print Locations */}
              <div className="space-y-2">
                <Label>Print Locations</Label>
                <div className="flex flex-wrap gap-2">
                  {PRINT_LOCATIONS.map(location => (
                    <Button
                      key={location}
                      type="button"
                      variant={item.printLocations.includes(location) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => togglePrintLocation(item.id, location)}
                    >
                      {location}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Item Price */}
              {item.unitPrice > 0 && (
                <div className="pt-2 border-t">
                  <div className="flex justify-between text-sm">
                    <span>Unit Price:</span>
                    <span className="font-medium">${item.unitPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Item Total:</span>
                    <span className="font-medium">
                      ${(item.unitPrice * getTotalQuantity(item)).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
          <CardDescription>Special instructions or details</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Any special requirements, rush order notes, etc."
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Total */}
      {estimatedTotal !== null && (
        <Card className="bg-primary/5 border-primary">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center text-lg">
              <span className="font-medium">Estimated Total:</span>
              <span className="text-2xl font-bold text-primary">
                ${estimatedTotal.toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
