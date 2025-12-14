import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faCreditCard, faFileUpload, faCheck } from '@fortawesome/free-solid-svg-icons';
import PaymentService from '../services/payment/payment.services';
import { getCurrencySymbol } from '../utils/currencyUtils';

const PaymentPopup = ({ isOpen, onClose, orderData, onSuccess, adminSelectedPaymentMethod }) => {
  // Format price in original currency (no conversion - price is already in order's currency)
  const formatPriceInCurrency = (priceValue, currency = 'USD') => {
    const numericPrice = parseFloat(priceValue) || 0;
    const symbol = getCurrencySymbol(currency);
    return `${symbol}${numericPrice.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const [paymentConfig, setPaymentConfig] = useState(null);
  const [selectedModule, setSelectedModule] = useState(adminSelectedPaymentMethod || '');
  const [selectedCurrency, setSelectedCurrency] = useState('');
  const [formData, setFormData] = useState({});
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [files, setFiles] = useState({});
  const [billingAddress, setBillingAddress] = useState({ address: "", city: "", postalCode: "", country: "" });
  const [shippingAddress, setShippingAddress] = useState({ address: "", city: "", postalCode: "", country: "" });

  useEffect(() => {
    if (isOpen) {
      if (adminSelectedPaymentMethod) {
        setSelectedModule(adminSelectedPaymentMethod);
      }
      fetchPaymentConfig();
    }
  }, [isOpen, adminSelectedPaymentMethod]);

  const fetchPaymentConfig = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await PaymentService.getPaymentConfig();
      if (response.status === 200 && response.data) {
        setPaymentConfig(response.data);
        
        // Set default currency if available
        const currencyField = response.data.sharedFields.find(field => 
          field.name.toLowerCase().includes('currency')
        );
        
        if (currencyField && currencyField.options && currencyField.options.length > 0) {
          setSelectedCurrency(currencyField.options[0]);
        }
      }
    } catch (error) {
      setError('Failed to load payment configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const handleModuleChange = (moduleName) => {
    setSelectedModule(moduleName);
    setFormData({});
    setFiles({});
    setAcceptedTerms(false);
  };

  const handleFieldChange = (fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleFileChange = (fieldName, file) => {
    setFiles(prev => ({
      ...prev,
      [fieldName]: file
    }));
  };

  const validateForm = () => {
    // Validate addresses
    const addressFields = ["address", "city", "postalCode", "country"];
    for (const field of addressFields) {
      if (!billingAddress[field]) {
        setError(`Please fill in billing ${field}`);
        return false;
      }
      if (!shippingAddress[field]) {
        setError(`Please fill in shipping ${field}`);
        return false;
      }
    }

    if (!selectedModule) {
      setError('Please select a payment method');
      return false;
    }

    const module = paymentConfig.modules.find(m => m.name === selectedModule);
    if (!module) {
      setError('Invalid payment method selected');
      return false;
    }

    // Check if currency is required and selected
    const currencyField = paymentConfig.sharedFields.find(field => 
      field.name.toLowerCase().includes('currency')
    );

    if (currencyField && currencyField.mandatory && !selectedCurrency) {
      setError(`Please select a currency`);
      return false;
    }

    // Check required shared fields (excluding currency as it's handled separately)
    for (const field of paymentConfig.sharedFields) {
      if (field.mandatory && !field.name.toLowerCase().includes('currency') && !formData[field.name]) {
        setError(`Please fill in the required field: ${field.name}`);
        return false;
      }
    }

    // Check required module-specific fields
    for (const field of module.specificFields) {
      if (field.mandatory && !field.providedByAdmin) {
        // For file/image fields, check if file is uploaded
        if ((field.type === 'file' || field.type === 'image') && !files[field.name]) {
          setError(`Please upload the required file: ${field.name}`);
          return false;
        }
        // For other field types, check form data
        else if (field.type !== 'file' && field.type !== 'image' && !formData[field.name]) {
          setError(`Please fill in the required field: ${field.name}`);
          return false;
        }
      }
    }

    if (module.termsAndConditions && !acceptedTerms) {
      setError('Please accept the terms and conditions');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Prepare fields data
      const fieldsData = { ...formData };
      
      // Add currency if selected
      if (selectedCurrency) {
        fieldsData.currency = selectedCurrency;
      }

      // If order doesn't exist yet, upload files first, then store payment details
      if (!orderData.orderId) {
        let uploadedFiles = [];
        
        // Upload files if any
        const fileList = Object.values(files).filter(Boolean);
        if (fileList.length > 0) {
          try {
            // For now, we'll store the file names. In production, you'd upload to server
            uploadedFiles = fileList.map(file => file.name);
          } catch (uploadError) {
            setError('Failed to upload files. Please try again.');
            return;
          }
        }

        // Store payment details in the order data for later use
        const updatedOrderData = {
          ...orderData,
          billingAddress,
          shippingAddress,
          paymentDetails: {
            module: selectedModule,
            acceptedTerms,
            fields: fieldsData,
            uploadedFiles: uploadedFiles,
            currency: selectedCurrency || 'USD',
            transactionRef: formData.transactionRef || formData.referenceNumber || '',
            files: files // Keep original files for upload
          }
        };
        
        // Call success with updated order data
        onSuccess && onSuccess(updatedOrderData);
        onClose();
        return;
      }

      // If order exists and adminSelectedPaymentMethod is provided, use submitPayment endpoint
      if (orderData.orderId && adminSelectedPaymentMethod) {
        const fileList = Object.values(files).filter(Boolean);
        const paymentDetails = {
          module: selectedModule,
          acceptedTerms,
          fields: fieldsData,
          currency: selectedCurrency || 'USD',
          transactionRef: formData.transactionRef || formData.referenceNumber || '',
        };
        
        onSuccess && onSuccess({
          billingAddress,
          shippingAddress,
          paymentDetails,
          files: fileList
        });
        onClose();
        return;
      }

      // If order exists, proceed with normal payment flow
      const fileList = Object.values(files).filter(Boolean);
      const response = await PaymentService.submitPaymentDetails({
        orderId: orderData.orderId,
        module: selectedModule,
        acceptedTerms,
        fields: fieldsData
      }, fileList.length > 0 ? fileList : undefined);

      if (response.status === 200) {
        // Now submit the actual payment
        const paymentResponse = await PaymentService.submitPayment({
          orderId: orderData.orderId,
          amount: orderData.totalAmount,
          currency: selectedCurrency || 'USD',
          module: selectedModule,
          paymentDetailsId: response.data._id,
          transactionRef: formData.transactionRef || formData.referenceNumber || ''
        });

        if (paymentResponse.status === 200) {
          onSuccess && onSuccess();
          onClose();
        }
      }
    } catch (error) {
      setError('Failed to process payment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field, isShared = false) => {
    const value = formData[field.name] || '';
    const fieldKey = `${isShared ? 'shared' : 'module'}_${field.name}`;

    if (field.providedByAdmin && field.value) {
      return (
        <div key={fieldKey} className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {field.name} {field.mandatory && <span className="text-red-500">*</span>}
          </label>
          <div className="p-3 bg-gray-100 rounded-lg text-sm text-gray-600">
            {field.value}
          </div>
        </div>
      );
    }

    switch (field.type) {
      case 'text':
      case 'number':
        return (
          <div key={fieldKey} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.name} {field.mandatory && <span className="text-red-500">*</span>}
            </label>
            <input
              type={field.type}
              value={value}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={`Enter ${field.name.toLowerCase()}`}
              required={field.mandatory}
            />
          </div>
        );

      case 'select':
        return (
          <div key={fieldKey} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.name} {field.mandatory && <span className="text-red-500">*</span>}
            </label>
            <select
              value={value}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required={field.mandatory}
            >
              <option value="">Select {field.name}</option>
              {field.options?.map((option, index) => (
                <option key={index} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        );

      case 'textarea':
        return (
          <div key={fieldKey} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.name} {field.mandatory && <span className="text-red-500">*</span>}
            </label>
            <textarea
              value={value}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder={`Enter ${field.name.toLowerCase()}`}
              required={field.mandatory}
            />
          </div>
        );

      case 'file':
      case 'image':
        return (
          <div key={fieldKey} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.name} {field.mandatory && <span className="text-red-500">*</span>}
            </label>
            <div className={`border-2 border-dashed rounded-lg p-4 ${
              field.mandatory && !files[field.name] 
                ? 'border-red-300 bg-red-50' 
                : 'border-gray-300'
            }`}>
              <input
                type="file"
                accept={field.type === 'image' ? 'image/*' : '*/*'}
                onChange={(e) => handleFileChange(field.name, e.target.files[0])}
                className="hidden"
                id={`file-${fieldKey}`}
                required={field.mandatory}
              />
              <label
                htmlFor={`file-${fieldKey}`}
                className="cursor-pointer flex items-center justify-center space-x-2 text-gray-600 hover:text-blue-600"
              >
                <FontAwesomeIcon icon={faFileUpload} />
                <span>
                  {files[field.name] ? (
                    <span className="text-green-600 font-medium">
                      ✓ {files[field.name].name}
                    </span>
                  ) : (
                    `Upload ${field.name}${field.mandatory ? ' (Required)' : ''}`
                  )}
                </span>
              </label>
              {field.mandatory && !files[field.name] && (
                <p className="text-red-500 text-xs mt-2 text-center">
                  This file is required
                </p>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#00000057] bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <FontAwesomeIcon icon={faCreditCard} className="text-blue-600 text-xl" />
            <h2 className="text-2xl font-bold text-gray-900">Payment Details</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FontAwesomeIcon icon={faTimes} className="text-xl" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading payment options...</p>
            </div>
          ) : error && !paymentConfig ? (
            <div className="text-center py-12">
              <div className="text-red-600 mb-4">
                <FontAwesomeIcon icon={faTimes} className="text-4xl" />
              </div>
              <p className="text-red-600 text-lg">{error}</p>
              <button
                onClick={fetchPaymentConfig}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Order Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Order Summary</h3>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="text-xl font-bold text-gray-900">
                    {formatPriceInCurrency(orderData.totalAmount, orderData.currency)}
                  </span>
                </div>
              </div>

              {/* Billing Address */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Billing Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={billingAddress.address}
                      onChange={(e) => setBillingAddress(prev => ({ ...prev, address: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter billing address"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={billingAddress.city}
                      onChange={(e) => setBillingAddress(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter city"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Postal Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={billingAddress.postalCode}
                      onChange={(e) => setBillingAddress(prev => ({ ...prev, postalCode: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter postal code"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Country <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={billingAddress.country}
                      onChange={(e) => setBillingAddress(prev => ({ ...prev, country: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Country</option>
                      <option value="Hongkong">Hongkong</option>
                      <option value="Dubai">Dubai</option>
        
                    </select>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Shipping Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.address}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, address: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter shipping address"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.city}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter city"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Postal Code <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={shippingAddress.postalCode}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, postalCode: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter postal code"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Country <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={shippingAddress.country}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, country: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Country</option>
                      <option value="Hongkong">Hongkong</option>
                      <option value="Dubai">Dubai</option>
          
                    </select>
                  </div>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {adminSelectedPaymentMethod ? 'Payment Method' : 'Select Payment Method'}
                  {adminSelectedPaymentMethod && <span className="text-sm font-normal text-gray-600 ml-2">(Selected by Admin)</span>}
                </h3>
                {adminSelectedPaymentMethod ? (
                  <div className="border-2 border-blue-500 bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 rounded-full border-2 border-blue-500 bg-blue-500">
                        <div className="w-full h-full rounded-full bg-white scale-50"></div>
                      </div>
                      <span className="font-medium text-gray-900">{adminSelectedPaymentMethod}</span>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {paymentConfig?.modules?.filter(module => module.enabled).map((module) => (
                      <div
                        key={module.name}
                        className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                          selectedModule === module.name
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleModuleChange(module.name)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-4 h-4 rounded-full border-2 ${
                            selectedModule === module.name
                              ? 'border-blue-500 bg-blue-500'
                              : 'border-gray-300'
                          }`}>
                            {selectedModule === module.name && (
                              <div className="w-full h-full rounded-full bg-white scale-50"></div>
                            )}
                          </div>
                          <span className="font-medium text-gray-900">{module.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Currency Selection */}
              {paymentConfig?.sharedFields?.find(field => 
                field.name.toLowerCase().includes('currency')
              ) && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Select Currency
                    {paymentConfig.sharedFields.find(field => 
                      field.name.toLowerCase().includes('currency') && field.mandatory
                    ) && <span className="text-red-500 ml-1">*</span>}
                  </h3>
                  <select
                    value={selectedCurrency}
                    onChange={(e) => setSelectedCurrency(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required={paymentConfig.sharedFields.find(field => 
                      field.name.toLowerCase().includes('currency') && field.mandatory
                    )}
                  >
                    <option value="">Select Currency</option>
                    {paymentConfig.sharedFields
                      .find(field => field.name.toLowerCase().includes('currency'))
                      ?.options?.map((currency, index) => (
                        <option key={index} value={currency}>
                          {currency}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* Shared Fields */}
              {paymentConfig?.sharedFields?.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">General Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {paymentConfig.sharedFields
                      .filter(field => !field.name.toLowerCase().includes('currency'))
                      .map((field) => renderField(field, true))}
                  </div>
                </div>
              )}

              {/* Module-specific Fields */}
              {selectedModule && paymentConfig?.modules?.find(m => m.name === selectedModule)?.specificFields?.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">{selectedModule} Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {paymentConfig.modules
                      .find(m => m.name === selectedModule)
                      .specificFields.map((field) => renderField(field, false))}
                  </div>
                </div>
              )}

              {/* Terms and Conditions */}
              {selectedModule && paymentConfig?.modules?.find(m => m.name === selectedModule)?.termsAndConditions && (
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="terms" className="text-sm text-gray-700">
                    I accept the terms and conditions for {selectedModule} payment method
                  </label>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="bg-red-100 text-red-700 p-3 rounded-lg text-sm">
                  <div className="flex items-start space-x-2">
                    <span className="text-red-500">⚠️</span>
                    <div>
                      <p className="font-medium">{error}</p>
                      <p className="text-xs mt-1 text-red-600">
                        Please check all required fields marked with * and try again.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedModule}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faCheck} />
                      <span>{adminSelectedPaymentMethod ? 'Submit Payment' : 'Place Order'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentPopup;
