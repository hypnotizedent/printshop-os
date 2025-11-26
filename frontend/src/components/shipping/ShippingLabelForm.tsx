/**
 * ShippingLabelForm Component
 * Create shipping labels using EasyPost API integration.
 * Connects to the Python EasyPost client via a Node.js wrapper.
 */
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Package, Truck, MapPin, CurrencyDollar, Printer, Download, ArrowRight, CheckCircle, Warning } from '@phosphor-icons/react';
import { toast } from 'sonner';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:1337';

interface Address {
  name: string;
  company: string;
  street1: string;
  street2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
}

interface Parcel {
  length: number;
  width: number;
  height: number;
  weight: number;
}

interface ShippingRate {
  id: string;
  carrier: string;
  service: string;
  rate: string;
  currency: string;
  deliveryDays: number | null;
  deliveryDate: string | null;
}

interface Shipment {
  id: string;
  trackingCode: string;
  labelUrl: string;
  labelPdfUrl: string;
  selectedRate: ShippingRate;
}

const PRESET_BOXES: Record<string, Parcel> = {
  'small-box': { length: 8, width: 6, height: 4, weight: 1 },
  'medium-box': { length: 12, width: 10, height: 6, weight: 3 },
  'large-box': { length: 18, width: 14, height: 8, weight: 5 },
  'flat-mailer': { length: 12, width: 9, height: 1, weight: 0.5 },
  'custom': { length: 0, width: 0, height: 0, weight: 0 },
};

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
];

const emptyAddress: Address = {
  name: '',
  company: '',
  street1: '',
  street2: '',
  city: '',
  state: '',
  zip: '',
  country: 'US',
  phone: '',
};

// Your shop's return address (customize this)
const SHOP_ADDRESS: Address = {
  name: 'PrintShop OS',
  company: 'Your Print Shop',
  street1: '123 Main Street',
  street2: '',
  city: 'Baltimore',
  state: 'MD',
  zip: '21202',
  country: 'US',
  phone: '(555) 123-4567',
};

export function ShippingLabelForm() {
  const [fromAddress, setFromAddress] = useState<Address>(SHOP_ADDRESS);
  const [toAddress, setToAddress] = useState<Address>(emptyAddress);
  const [parcel, setParcel] = useState<Parcel>(PRESET_BOXES['medium-box']);
  const [boxPreset, setBoxPreset] = useState('medium-box');
  
  const [isGettingRates, setIsGettingRates] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [selectedRateId, setSelectedRateId] = useState<string | null>(null);
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [shipmentId, setShipmentId] = useState<string | null>(null);

  const handleBoxPresetChange = (preset: string) => {
    setBoxPreset(preset);
    if (preset !== 'custom') {
      setParcel(PRESET_BOXES[preset]);
    }
  };

  const validateAddresses = (): boolean => {
    const required = ['name', 'street1', 'city', 'state', 'zip'];
    
    for (const field of required) {
      if (!toAddress[field as keyof Address]) {
        toast.error(`Recipient ${field} is required`);
        return false;
      }
    }
    
    if (parcel.weight <= 0) {
      toast.error('Package weight is required');
      return false;
    }
    
    if (parcel.length <= 0 || parcel.width <= 0 || parcel.height <= 0) {
      toast.error('Package dimensions are required');
      return false;
    }
    
    return true;
  };

  const getRates = async () => {
    if (!validateAddresses()) return;
    
    setIsGettingRates(true);
    setRates([]);
    setSelectedRateId(null);
    setShipment(null);
    
    try {
      const response = await fetch(`${API_BASE}/api/shipping/rates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromAddress, toAddress, parcel }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || data.message || 'Failed to get rates');
      }
      
      if (data.rates && data.rates.length > 0) {
        setRates(data.rates);
        setShipmentId(data.shipmentId);
        toast.success('Rates retrieved successfully');
      } else {
        toast.error('No shipping rates available for this route');
      }
    } catch (error: any) {
      console.error('Failed to get rates:', error);
      toast.error(error.message || 'Failed to get shipping rates');
    } finally {
      setIsGettingRates(false);
    }
  };

  const purchaseLabel = async () => {
    if (!selectedRateId || !shipmentId) {
      toast.error('Please select a shipping rate');
      return;
    }
    
    setIsPurchasing(true);
    
    try {
      const response = await fetch(`${API_BASE}/api/shipping/buy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shipmentId, rateId: selectedRateId }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || data.message || 'Failed to purchase label');
      }
      
      setShipment({
        id: data.id,
        trackingCode: data.trackingCode,
        labelUrl: data.labelUrl,
        labelPdfUrl: data.labelPdfUrl,
        selectedRate: data.selectedRate,
      });
      
      toast.success('Label purchased successfully!');
    } catch (error: any) {
      console.error('Failed to purchase label:', error);
      toast.error(error.message || 'Failed to purchase label');
    } finally {
      setIsPurchasing(false);
    }
  };

  const printLabel = () => {
    if (shipment?.labelUrl) {
      window.open(shipment.labelUrl, '_blank');
    }
  };

  const downloadLabel = () => {
    if (shipment?.labelPdfUrl) {
      const link = document.createElement('a');
      link.href = shipment.labelPdfUrl;
      link.download = `label-${shipment.trackingCode}.pdf`;
      link.click();
    }
  };

  const resetForm = () => {
    setToAddress(emptyAddress);
    setParcel(PRESET_BOXES['medium-box']);
    setBoxPreset('medium-box');
    setRates([]);
    setSelectedRateId(null);
    setShipment(null);
    setShipmentId(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Create Shipping Label</h1>
          <p className="text-muted-foreground">Generate shipping labels with EasyPost</p>
        </div>
        {shipment && (
          <Button variant="outline" onClick={resetForm}>
            Create Another Label
          </Button>
        )}
      </div>

      {/* Success State */}
      {shipment && (
        <Card className="border-green-500 bg-green-50 dark:bg-green-950">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle size={24} className="text-green-600" weight="fill" />
              <CardTitle className="text-green-700 dark:text-green-300">
                Label Created Successfully!
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground">Tracking Number</Label>
                <p className="font-mono font-medium">{shipment.trackingCode}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Service</Label>
                <p className="font-medium">
                  {shipment.selectedRate.carrier} {shipment.selectedRate.service}
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button onClick={printLabel}>
                <Printer className="mr-2" size={16} />
                Print Label
              </Button>
              <Button variant="outline" onClick={downloadLabel}>
                <Download className="mr-2" size={16} />
                Download PDF
              </Button>
            </div>
            
            {/* Label Preview */}
            <div className="mt-4 p-4 bg-white rounded-lg border">
              <img
                src={shipment.labelUrl}
                alt="Shipping Label"
                className="max-w-sm mx-auto"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form */}
      {!shipment && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* From Address */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MapPin size={20} className="text-primary" />
                <CardTitle>From Address</CardTitle>
              </div>
              <CardDescription>Your shop's return address</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={fromAddress.name}
                    onChange={(e) => setFromAddress(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Company</Label>
                  <Input
                    value={fromAddress.company}
                    onChange={(e) => setFromAddress(prev => ({ ...prev, company: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Street Address</Label>
                <Input
                  value={fromAddress.street1}
                  onChange={(e) => setFromAddress(prev => ({ ...prev, street1: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Apt, Suite, etc.</Label>
                <Input
                  value={fromAddress.street2}
                  onChange={(e) => setFromAddress(prev => ({ ...prev, street2: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input
                    value={fromAddress.city}
                    onChange={(e) => setFromAddress(prev => ({ ...prev, city: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>State</Label>
                  <Select
                    value={fromAddress.state}
                    onValueChange={(v) => setFromAddress(prev => ({ ...prev, state: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="State" />
                    </SelectTrigger>
                    <SelectContent>
                      {US_STATES.map(state => (
                        <SelectItem key={state} value={state}>{state}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>ZIP</Label>
                  <Input
                    value={fromAddress.zip}
                    onChange={(e) => setFromAddress(prev => ({ ...prev, zip: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* To Address */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Truck size={20} className="text-primary" />
                <CardTitle>To Address</CardTitle>
              </div>
              <CardDescription>Recipient's shipping address</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input
                    value={toAddress.name}
                    onChange={(e) => setToAddress(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Company</Label>
                  <Input
                    value={toAddress.company}
                    onChange={(e) => setToAddress(prev => ({ ...prev, company: e.target.value }))}
                    placeholder="Acme Inc."
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Street Address *</Label>
                <Input
                  value={toAddress.street1}
                  onChange={(e) => setToAddress(prev => ({ ...prev, street1: e.target.value }))}
                  placeholder="456 Market Street"
                />
              </div>
              <div className="space-y-2">
                <Label>Apt, Suite, etc.</Label>
                <Input
                  value={toAddress.street2}
                  onChange={(e) => setToAddress(prev => ({ ...prev, street2: e.target.value }))}
                  placeholder="Suite 100"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>City *</Label>
                  <Input
                    value={toAddress.city}
                    onChange={(e) => setToAddress(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="Los Angeles"
                  />
                </div>
                <div className="space-y-2">
                  <Label>State *</Label>
                  <Select
                    value={toAddress.state}
                    onValueChange={(v) => setToAddress(prev => ({ ...prev, state: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="State" />
                    </SelectTrigger>
                    <SelectContent>
                      {US_STATES.map(state => (
                        <SelectItem key={state} value={state}>{state}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>ZIP *</Label>
                  <Input
                    value={toAddress.zip}
                    onChange={(e) => setToAddress(prev => ({ ...prev, zip: e.target.value }))}
                    placeholder="90001"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={toAddress.phone}
                  onChange={(e) => setToAddress(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="(555) 123-4567"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Package Details */}
      {!shipment && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Package size={20} className="text-primary" />
              <CardTitle>Package Details</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label>Box Size</Label>
                <Select value={boxPreset} onValueChange={handleBoxPresetChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small-box">Small Box</SelectItem>
                    <SelectItem value="medium-box">Medium Box</SelectItem>
                    <SelectItem value="large-box">Large Box</SelectItem>
                    <SelectItem value="flat-mailer">Flat Mailer</SelectItem>
                    <SelectItem value="custom">Custom Size</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Length (in)</Label>
                <Input
                  type="number"
                  value={parcel.length || ''}
                  onChange={(e) => setParcel(prev => ({ ...prev, length: parseFloat(e.target.value) || 0 }))}
                  disabled={boxPreset !== 'custom'}
                />
              </div>
              <div className="space-y-2">
                <Label>Width (in)</Label>
                <Input
                  type="number"
                  value={parcel.width || ''}
                  onChange={(e) => setParcel(prev => ({ ...prev, width: parseFloat(e.target.value) || 0 }))}
                  disabled={boxPreset !== 'custom'}
                />
              </div>
              <div className="space-y-2">
                <Label>Height (in)</Label>
                <Input
                  type="number"
                  value={parcel.height || ''}
                  onChange={(e) => setParcel(prev => ({ ...prev, height: parseFloat(e.target.value) || 0 }))}
                  disabled={boxPreset !== 'custom'}
                />
              </div>
              <div className="space-y-2">
                <Label>Weight (lbs) *</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={parcel.weight || ''}
                  onChange={(e) => setParcel(prev => ({ ...prev, weight: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.0"
                />
              </div>
            </div>
            
            <div className="mt-6">
              <Button 
                onClick={getRates} 
                disabled={isGettingRates}
                className="w-full md:w-auto"
              >
                {isGettingRates ? (
                  'Getting Rates...'
                ) : (
                  <>
                    Get Shipping Rates
                    <ArrowRight className="ml-2" size={16} />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Shipping Rates */}
      {rates.length > 0 && !shipment && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CurrencyDollar size={20} className="text-primary" />
              <CardTitle>Select Shipping Rate</CardTitle>
            </div>
            <CardDescription>
              Choose the best option for your shipment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {rates
                .sort((a, b) => parseFloat(a.rate) - parseFloat(b.rate))
                .map(rate => (
                  <div
                    key={rate.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedRateId === rate.id
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-muted-foreground'
                    }`}
                    onClick={() => setSelectedRateId(rate.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          selectedRateId === rate.id
                            ? 'border-primary bg-primary'
                            : 'border-muted-foreground'
                        }`} />
                        <div>
                          <p className="font-medium">
                            {rate.carrier} {rate.service}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {rate.deliveryDays 
                              ? `${rate.deliveryDays} business day${rate.deliveryDays > 1 ? 's' : ''}`
                              : 'Delivery time varies'
                            }
                          </p>
                        </div>
                      </div>
                      <p className="text-xl font-bold">
                        ${parseFloat(rate.rate).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
            
            <div className="mt-6">
              <Button 
                onClick={purchaseLabel}
                disabled={!selectedRateId || isPurchasing}
                size="lg"
                className="w-full"
              >
                {isPurchasing ? (
                  'Purchasing Label...'
                ) : (
                  <>
                    <Printer className="mr-2" size={18} />
                    Purchase Label
                    {selectedRateId && (
                      <span className="ml-2">
                        (${parseFloat(rates.find(r => r.id === selectedRateId)?.rate || '0').toFixed(2)})
                      </span>
                    )}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Notice */}
      {!shipment && (
        <Card className="bg-amber-50 dark:bg-amber-950 border-amber-200">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <Warning size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  EasyPost Integration Note
                </p>
                <p className="text-amber-700 dark:text-amber-300 mt-1">
                  This form is connected to EasyPost for live shipping rates and label generation.
                  Make sure your <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">EASYPOST_API_KEY</code> is 
                  configured in your environment variables.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
