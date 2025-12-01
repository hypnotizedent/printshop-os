/**
 * Shipping Controller
 * Handles shipping label creation via EasyPost API
 */

import EasyPostClient from '@easypost/api';
import type { Context } from 'koa';

// Initialize EasyPost client
const getClient = () => {
  const apiKey = process.env.EASYPOST_API_KEY;
  if (!apiKey) {
    throw new Error('EASYPOST_API_KEY environment variable is not set');
  }
  return new EasyPostClient(apiKey);
};

export default {
  /**
   * Get shipping rates for a shipment
   */
  async getRates(ctx: Context) {
    try {
      const { fromAddress, toAddress, parcel } = ctx.request.body;
      
      if (!fromAddress || !toAddress || !parcel) {
        return ctx.badRequest('Missing required fields: fromAddress, toAddress, parcel');
      }

      const client = getClient();
      
      // Create shipment to get rates
      const shipment = await client.Shipment.create({
        from_address: {
          name: fromAddress.name,
          company: fromAddress.company,
          street1: fromAddress.street1,
          street2: fromAddress.street2,
          city: fromAddress.city,
          state: fromAddress.state,
          zip: fromAddress.zip,
          country: fromAddress.country || 'US',
          phone: fromAddress.phone,
        },
        to_address: {
          name: toAddress.name,
          company: toAddress.company,
          street1: toAddress.street1,
          street2: toAddress.street2,
          city: toAddress.city,
          state: toAddress.state,
          zip: toAddress.zip,
          country: toAddress.country || 'US',
          phone: toAddress.phone,
        },
        parcel: {
          length: parcel.length,
          width: parcel.width,
          height: parcel.height,
          weight: parcel.weight * 16, // Convert lbs to oz
        },
      });

      // Format rates for frontend
      const rates = shipment.rates.map((rate: any) => ({
        id: rate.id,
        carrier: rate.carrier,
        service: rate.service,
        rate: rate.rate,
        currency: rate.currency,
        deliveryDays: rate.delivery_days,
        deliveryDate: rate.delivery_date,
      }));

      return {
        shipmentId: shipment.id,
        rates,
      };
    } catch (error: any) {
      console.error('EasyPost getRates error:', error);
      
      if (error.message?.includes('EASYPOST_API_KEY')) {
        return ctx.internalServerError('EasyPost API key not configured');
      }
      
      return ctx.badRequest(error.message || 'Failed to get shipping rates');
    }
  },

  /**
   * Purchase a shipping label
   */
  async buyLabel(ctx: Context) {
    try {
      const { shipmentId, rateId } = ctx.request.body;
      
      if (!shipmentId || !rateId) {
        return ctx.badRequest('Missing required fields: shipmentId, rateId');
      }

      const client = getClient();
      
      // Retrieve shipment
      const shipment = await client.Shipment.retrieve(shipmentId);
      
      // Find the selected rate
      const rate = shipment.rates.find((r: any) => r.id === rateId);
      if (!rate) {
        return ctx.badRequest('Rate not found');
      }
      
      // Buy the shipment
      const boughtShipment = await client.Shipment.buy(shipmentId, rate);

      return {
        id: boughtShipment.id,
        trackingCode: boughtShipment.tracking_code,
        labelUrl: boughtShipment.postage_label?.label_url,
        labelPdfUrl: boughtShipment.postage_label?.label_pdf_url,
        selectedRate: {
          id: boughtShipment.selected_rate?.id,
          carrier: boughtShipment.selected_rate?.carrier,
          service: boughtShipment.selected_rate?.service,
          rate: boughtShipment.selected_rate?.rate,
          currency: boughtShipment.selected_rate?.currency,
          deliveryDays: boughtShipment.selected_rate?.delivery_days,
        },
      };
    } catch (error: any) {
      console.error('EasyPost buyLabel error:', error);
      return ctx.badRequest(error.message || 'Failed to purchase label');
    }
  },

  /**
   * Track a shipment
   */
  async track(ctx: Context) {
    try {
      const { trackingCode } = ctx.params;
      
      if (!trackingCode) {
        return ctx.badRequest('Missing tracking code');
      }

      const client = getClient();
      
      const tracker = await client.Tracker.create({
        tracking_code: trackingCode,
      });

      return {
        id: tracker.id,
        trackingCode: tracker.tracking_code,
        status: tracker.status,
        statusDetail: tracker.status_detail,
        estDeliveryDate: tracker.est_delivery_date,
        trackingDetails: tracker.tracking_details?.map((detail: any) => ({
          message: detail.message,
          status: detail.status,
          datetime: detail.datetime,
          location: detail.tracking_location ? {
            city: detail.tracking_location.city,
            state: detail.tracking_location.state,
            country: detail.tracking_location.country,
          } : null,
        })),
      };
    } catch (error: any) {
      console.error('EasyPost track error:', error);
      return ctx.badRequest(error.message || 'Failed to track shipment');
    }
  },

  /**
   * Validate an address
   */
  async validateAddress(ctx: Context) {
    try {
      const { address } = ctx.request.body;
      
      if (!address) {
        return ctx.badRequest('Missing address');
      }

      const client = getClient();
      
      const verifiedAddress = await client.Address.createAndVerify({
        street1: address.street1,
        street2: address.street2,
        city: address.city,
        state: address.state,
        zip: address.zip,
        country: address.country || 'US',
      });

      return {
        valid: true,
        address: {
          street1: verifiedAddress.street1,
          street2: verifiedAddress.street2,
          city: verifiedAddress.city,
          state: verifiedAddress.state,
          zip: verifiedAddress.zip,
          country: verifiedAddress.country,
        },
      };
    } catch (error: any) {
      console.error('EasyPost validateAddress error:', error);
      return {
        valid: false,
        errors: [error.message || 'Address validation failed'],
      };
    }
  },
};
