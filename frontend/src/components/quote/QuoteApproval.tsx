/**
 * Quote Approval Component
 * Handles quote approval and rejection without login
 */

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

interface QuoteItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Quote {
  id: string;
  quoteNumber: string;
  status: string;
  items: QuoteItem[];
  subtotal: number;
  tax?: number;
  total: number;
  validUntil?: string;
  notes?: string;
  customer?: {
    name: string;
    email: string;
  };
}

const QuoteApproval: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadQuoteByToken();
  }, [token]);

  const loadQuoteByToken = async () => {
    try {
      setLoading(true);
      setError(null);

      const apiUrl = import.meta.env.VITE_STRAPI_URL || 'http://localhost:1337';
      const response = await fetch(`${apiUrl}/api/quotes/verify/${token}`);
      
      if (!response.ok) {
        throw new Error('Invalid or expired quote link');
      }

      const data = await response.json();
      setQuote(data.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load quote');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!token) return;

    try {
      setSubmitting(true);
      setError(null);

      const apiUrl = import.meta.env.VITE_STRAPI_URL || 'http://localhost:1337';
      const response = await fetch(`${apiUrl}/api/quotes/approve/${token}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to approve quote');
      }

      const data = await response.json();
      setSuccess('Quote approved successfully! We will be in touch shortly.');
      setQuote(data.data);
    } catch (err: any) {
      setError(err.message || 'Failed to approve quote');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!token) return;

    try {
      setSubmitting(true);
      setError(null);

      const apiUrl = import.meta.env.VITE_STRAPI_URL || 'http://localhost:1337';
      const response = await fetch(`${apiUrl}/api/quotes/reject/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: rejectionReason,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to reject quote');
      }

      const data = await response.json();
      setSuccess('Quote declined. Thank you for your response.');
      setQuote(data.data);
      setShowRejectionForm(false);
    } catch (err: any) {
      setError(err.message || 'Failed to reject quote');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading quote...</p>
        </div>
      </div>
    );
  }

  if (error && !quote) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Error</h3>
            <p className="mt-2 text-sm text-gray-500">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!quote) {
    return null;
  }

  const isAlreadyProcessed = quote.status === 'Approved' || quote.status === 'Rejected';
  const isExpired = quote.validUntil && new Date(quote.validUntil) < new Date();

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Quote Review</h1>
          <p className="mt-2 text-sm text-gray-600">Quote #{quote.quoteNumber}</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">{success}</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Status Badge */}
        {isAlreadyProcessed && (
          <div className="mb-6 text-center">
            <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
              quote.status === 'Approved' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {quote.status === 'Approved' ? '✓ Approved' : '✗ Declined'}
            </span>
          </div>
        )}

        {/* Quote Details */}
        <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-medium text-gray-900">Quote Details</h2>
          </div>
          
          <div className="px-6 py-4">
            {quote.customer && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-500">Customer</p>
                <p className="mt-1 text-sm text-gray-900">{quote.customer.name}</p>
                <p className="text-sm text-gray-500">{quote.customer.email}</p>
              </div>
            )}

            {quote.validUntil && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-500">Valid Until</p>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(quote.validUntil).toLocaleDateString()}
                  {isExpired && (
                    <span className="ml-2 text-red-600">(Expired)</span>
                  )}
                </p>
              </div>
            )}

            {/* Items Table */}
            <div className="mt-6">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {quote.items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 text-sm text-gray-900">{item.description}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{item.quantity}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">${item.unitPrice.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">${item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-sm font-medium text-gray-900 text-right">Subtotal</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">${quote.subtotal.toFixed(2)}</td>
                  </tr>
                  {quote.tax && (
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-sm text-gray-900 text-right">Tax</td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">${quote.tax.toFixed(2)}</td>
                    </tr>
                  )}
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-lg font-bold text-gray-900 text-right">Total</td>
                    <td className="px-4 py-3 text-lg font-bold text-gray-900 text-right">${quote.total.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {quote.notes && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-500">Notes</p>
                <p className="mt-1 text-sm text-gray-700">{quote.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {!isAlreadyProcessed && !isExpired && (
          <div className="bg-white shadow rounded-lg p-6">
            {!showRejectionForm ? (
              <div className="flex gap-4">
                <button
                  onClick={handleApprove}
                  disabled={submitting}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Processing...' : 'Approve Quote'}
                </button>
                <button
                  onClick={() => setShowRejectionForm(true)}
                  disabled={submitting}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-6 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Decline Quote
                </button>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Decline Quote</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Please let us know why you're declining this quote (optional):
                </p>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your reason here..."
                />
                <div className="mt-4 flex gap-4">
                  <button
                    onClick={handleReject}
                    disabled={submitting}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-6 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Processing...' : 'Confirm Decline'}
                  </button>
                  <button
                    onClick={() => setShowRejectionForm(false)}
                    disabled={submitting}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-3 px-6 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {isExpired && !isAlreadyProcessed && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              This quote has expired. Please contact us if you'd like to receive an updated quote.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuoteApproval;
