import { useEffect, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { strapi } from '../lib/strapi';

export default function Home() {
  const [product, setProduct] = useState('AS Colour Staple Tee');
  const [variantId, setVariantId] = useState('1234567890');
  const [designURL, setDesignURL] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);

  const onDrop = async (acceptedFiles: File[]) => {
    if (!acceptedFiles.length) return;
    const file = acceptedFiles[0];
    setUploading(true);

    try {
      const result = await strapi.uploadDesignFile(file);
      if (result?.url) {
        setDesignURL(result.url);
      } else {
        alert('Failed to upload artwork.');
      }
    } catch (error) {
      console.error('Upload Error:', error);
      alert('Failed to upload artwork.');
    }
    setUploading(false);
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  const handleSubmit = async () => {
    if (!designURL) {
      alert('Please upload a design first.');
      return;
    }

    try {
      // Create a custom order in Strapi
      const order = await strapi.createCustomOrder({
        sessionId: `order_${Date.now()}`,
        customerEmail: customerEmail,
        garmentType: 't-shirt',
        designs: {
          front: { url: designURL, notes: notes }
        },
        pricing: {
          basePrice: 0,
          quantity: 1
        },
        status: 'pending',
        notes: notes
      });

      console.log('Design saved!', order);
      
      // Redirect to cart (or show success)
      window.location.href = `/success?order=${order.data?.documentId || 'created'}`;
    } catch (error) {
      console.error('Order Creation Error:', error);
      alert('Error saving your design.');
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Custom Apparel Designer</h1>

      <div className="mb-4">
        <label className="block font-semibold mb-1">Product</label>
        <input
          type="text"
          className="w-full border px-3 py-2 rounded"
          value={product}
          onChange={(e) => setProduct(e.target.value)}
        />
      </div>

      <div className="mb-4">
        <label className="block font-semibold mb-1">Variant ID</label>
        <input
          type="text"
          className="w-full border px-3 py-2 rounded"
          value={variantId}
          onChange={(e) => setVariantId(e.target.value)}
        />
      </div>

      <div className="mb-4">
        <label className="block font-semibold mb-1">Customer Email</label>
        <input
          type="email"
          className="w-full border px-3 py-2 rounded"
          value={customerEmail}
          onChange={(e) => setCustomerEmail(e.target.value)}
        />
      </div>

      <div className="mb-4">
        <label className="block font-semibold mb-1">Notes</label>
        <textarea
          className="w-full border px-3 py-2 rounded"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <div
        {...getRootProps()}
        className="border-2 border-dashed border-gray-400 p-6 text-center mb-6 cursor-pointer rounded"
      >
        <input {...getInputProps()} />
        {uploading ? 'Uploading...' : designURL ? 'Design uploaded ✔️' : 'Click or drop design file here'}
      </div>

      <button
        className="bg-black text-white px-6 py-3 rounded hover:bg-gray-800"
        onClick={handleSubmit}
        disabled={uploading}
      >
        Submit Design & Add to Cart
      </button>
    </div>
  );
}
