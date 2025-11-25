import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface Preferences {
  orderConfirmation: boolean;
  artApproval: boolean;
  productionUpdates: boolean;
  shipmentNotifications: boolean;
  quoteReminders: boolean;
  marketingEmails: boolean;
  smsNotifications: boolean;
}

export function NotificationPrefs() {
  const [preferences, setPreferences] = useState<Preferences>({
    orderConfirmation: true,
    artApproval: true,
    productionUpdates: true,
    shipmentNotifications: true,
    quoteReminders: true,
    marketingEmails: false,
    smsNotifications: false,
  });
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/customer-preferences/me', {
      //   headers: { Authorization: `Bearer ${token}` }
      // });
      // const data = await response.json();
      // setPreferences(data);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      toast.error('Failed to load preferences');
    } finally {
      setFetchingData(false);
    }
  };

  const handleToggle = (key: keyof Preferences) => {
    setPreferences({ ...preferences, [key]: !preferences[key] });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // await fetch('/api/customer-preferences/me', {
      //   method: 'PATCH',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     Authorization: `Bearer ${token}`,
      //   },
      //   body: JSON.stringify(preferences),
      // });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast.success('Preferences updated successfully');
    } catch (error) {
      toast.error('Failed to update preferences');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingData) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="text-lg font-semibold mb-4">Order & Production Notifications</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="orderConfirmation">Order Confirmations</Label>
              <p className="text-sm text-muted-foreground">
                Receive emails when orders are placed
              </p>
            </div>
            <Switch
              id="orderConfirmation"
              checked={preferences.orderConfirmation}
              onCheckedChange={() => handleToggle('orderConfirmation')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="artApproval">Art Approval Requests</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when artwork needs your approval
              </p>
            </div>
            <Switch
              id="artApproval"
              checked={preferences.artApproval}
              onCheckedChange={() => handleToggle('artApproval')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="productionUpdates">Production Updates</Label>
              <p className="text-sm text-muted-foreground">
                Stay informed about production progress
              </p>
            </div>
            <Switch
              id="productionUpdates"
              checked={preferences.productionUpdates}
              onCheckedChange={() => handleToggle('productionUpdates')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="shipmentNotifications">Shipment Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive tracking updates when orders ship
              </p>
            </div>
            <Switch
              id="shipmentNotifications"
              checked={preferences.shipmentNotifications}
              onCheckedChange={() => handleToggle('shipmentNotifications')}
            />
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-semibold mb-4">Quote & Reminders</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="quoteReminders">Quote Reminders</Label>
              <p className="text-sm text-muted-foreground">
                Get reminders about pending quotes
              </p>
            </div>
            <Switch
              id="quoteReminders"
              checked={preferences.quoteReminders}
              onCheckedChange={() => handleToggle('quoteReminders')}
            />
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-semibold mb-4">Marketing & SMS</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="marketingEmails">Marketing Emails</Label>
              <p className="text-sm text-muted-foreground">
                Receive promotional emails and special offers
              </p>
            </div>
            <Switch
              id="marketingEmails"
              checked={preferences.marketingEmails}
              onCheckedChange={() => handleToggle('marketingEmails')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="smsNotifications">SMS Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive text messages for critical updates
              </p>
            </div>
            <Switch
              id="smsNotifications"
              checked={preferences.smsNotifications}
              onCheckedChange={() => handleToggle('smsNotifications')}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Preferences
        </Button>
      </div>
    </div>
  );
}
