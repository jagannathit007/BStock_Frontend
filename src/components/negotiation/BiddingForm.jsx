import React, { useState } from 'react';
import { DollarSign, MessageSquare, Send, X } from 'lucide-react';
import NegotiationService from '../../services/negotiation/negotiation.services';
import iphoneImage from '../../assets/iphone.png';

const BiddingForm = ({ product, isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    offerPrice: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.offerPrice || parseFloat(formData.offerPrice) <= 0) {
      alert('Please enter a valid offer price');
      return;
    }

    setLoading(true);
    try {
      await NegotiationService.createBid({
        productId: product.id,
        offerPrice: parseFloat(formData.offerPrice),
        message: formData.message
      });

      setFormData({ offerPrice: '', message: '' });
      onSuccess && onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating bid:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ offerPrice: '', message: '' });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <DollarSign className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Make a Bid</h2>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Product Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-3">
              <img
                src={imageError ? iphoneImage : (product.mainImage || product.imageUrl)}
                alt={product.name}
                className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                onError={handleImageError}
              />
              <div>
                <h3 className="font-medium text-gray-900">{product.name}</h3>
                <p className="text-sm text-gray-600">
                  Current Price: <span className="font-medium text-green-600">${product.price}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Offer Price *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  value={formData.offerPrice}
                  onChange={(e) => setFormData({ ...formData, offerPrice: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your offer"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Enter your best offer for this product
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <div className="relative">
                <div className="absolute top-3 left-3 pointer-events-none">
                  <MessageSquare className="h-5 w-5 text-gray-400" />
                </div>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Add a message to your bid..."
                  maxLength={500}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {formData.message.length}/500 characters
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !formData.offerPrice}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Bid</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Info */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">How it works:</h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Your bid will be sent to our admin team</li>
              <li>• They can accept your offer or make a counter offer</li>
              <li>• You'll be notified of any responses</li>
              <li>• Once accepted, you can proceed to purchase</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BiddingForm;
