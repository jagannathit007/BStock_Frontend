import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import CartService from "../../services/cart/cart.services";
import OrderService from "../../services/order/order.services";
import PaymentPopup from "../PaymentPopup";
import iphoneImage from "../../assets/iphone.png";
import { convertPrice } from "../../utils/currencyUtils";

const CheckoutPage = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [imageErrors, setImageErrors] = useState({});
  const [billingAddress, setBillingAddress] = useState({ address: "", city: "", postalCode: "", country: "" });
  const [shippingAddress, setShippingAddress] = useState({ address: "", city: "", postalCode: "", country: "" });
  const [showPaymentPopup, setShowPaymentPopup] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [costSummary, setCostSummary] = useState({
    totalCartValue: 0,
    totalAmount: 0,
    appliedCharges: []
  });

  const handleImageError = (id) => setImageErrors((p) => ({ ...p, [id]: true }));

  const mapCartItemToUi = (item) => {
    const id = item.productId;
    const skuFamilyId = item.skuFamilyId?._id || item.skuFamilyId || null;
    const subSkuFamilyId = item.subSkuFamilyId?._id || item.subSkuFamilyId || null;
    const name = item.subSkuFamilyId?.name || item.skuFamilyId?.name || "Product";
    const baseUrl = import.meta.env.VITE_BASE_URL || "http://localhost:3200";
    
    // Prioritize subSkuFamilyId image, then skuFamilyId image, then dummy image
    let imageUrl = null;
    if (item.subSkuFamilyId?.images?.[0]) {
      imageUrl = `${baseUrl}/${item.subSkuFamilyId.images[0]}`;
    } else if (item.skuFamilyId?.images?.[0]) {
      imageUrl = `${baseUrl}/${item.skuFamilyId.images[0]}`;
    } else {
      imageUrl = iphoneImage; // Use dummy image if no image available
    }
    
    const storage = item.storage || "";
    const color = item.color || "";
    const description = [storage, color].filter(Boolean).join(" • ") || item.specification || "";
    const price = Number(item.price) || 0;
    const stockCount = Number(item.stock) || 0;
    const moq = Number(item.moq) || 1;
    return { id, skuFamilyId, subSkuFamilyId, name, description, price, stockCount, moq, imageUrl, quantity: Number(item.quantity) || Math.max(moq, 1) };
  };

  const fetchCart = useCallback(async (shippingCountry = null) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await CartService.list(1, 50, shippingCountry);
      if (response.status === 200) {
        const items = (response.data?.docs || []).map(mapCartItemToUi);
        setCartItems(items);
        // Store cost summary from response
        if (response.data?.costSummary) {
          setCostSummary(response.data.costSummary);
        } else {
          setCostSummary({
            totalCartValue: 0,
            totalAmount: 0,
            appliedCharges: []
          });
        }
      } else {
        setError(response.message || "Failed to fetch cart");
      }
    } catch (e) {
      setError(e.response?.data?.message || e.message || "An error occurred while fetching cart");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchCart(); }, [fetchCart]);
  
  // Recalculate costs when shipping country changes
  useEffect(() => {
    if (shippingAddress.country) {
      fetchCart(shippingAddress.country);
    }
  }, [shippingAddress.country, fetchCart]);

  const handleAddressChange = (type, field, value) => {
    if (type === "billing") setBillingAddress((prev) => ({ ...prev, [field]: value }));
    else setShippingAddress((prev) => ({ ...prev, [field]: value }));
  };

  const totalPrice = useMemo(() => cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0), [cartItems]);
  const finalTotal = costSummary.totalAmount > 0 ? costSummary.totalAmount : totalPrice;

  const validateAddresses = () => {
    const req = ["address", "city", "postalCode", "country"];
    return req.every((f) => billingAddress[f] && shippingAddress[f]);
  };

  const handlePay = (e) => {
    e.preventDefault();
    if (!validateAddresses()) { setError("Please fill in all address fields"); return; }
    if (cartItems.length === 0) { setError("Cart is empty"); return; }
    setCurrentOrder({
      orderId: null,
      totalAmount: finalTotal,
      orderNumber: null,
      cartItems: cartItems.map((it) => ({ 
        productId: it.id, 
        skuFamilyId: it.skuFamilyId || null,
        subSkuFamilyId: it.subSkuFamilyId || null,
        quantity: Number(it.quantity), 
        price: Number(it.price) 
      })),
      billingAddress,
      shippingAddress,
    });
    setShowPaymentPopup(true);
  };

  const handlePaymentSuccess = async (orderWithPayment) => {
    try {
      setIsLoading(true);
      const payload = {
        cartItems: orderWithPayment.cartItems,
        billingAddress: orderWithPayment.billingAddress,
        shippingAddress: orderWithPayment.shippingAddress,
        paymentDetails: orderWithPayment.paymentDetails,
      };
      const res = await OrderService.createOrder(payload);
      if (res?.success || res?.status === 200) {
        setShowPaymentPopup(false);
        navigate("/order", { state: { order: res.data } });
      } else {
        setError(res?.message || "Failed to create order");
      }
    } catch (e) {
      setError(e.response?.data?.message || e.message || "An error occurred while creating order");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate(-1)} className="text-sm text-gray-600 hover:text-gray-900">Back</button>
            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
              <span>Cart</span>
              <span>›</span>
              <span className="font-medium text-gray-900">Checkout</span>
              <span>›</span>
              <span>Payment</span>
            </div>
          </div>
          <h1 className="mt-3 text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">Checkout</h1>
          <p className="text-gray-600 mt-1">Review your order and complete payment</p>
        </div>

        {error && <div className="mb-4 p-3 rounded-lg bg-red-100 text-red-700 text-sm">{error}</div>}

        {isLoading && cartItems.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex items-center gap-3 text-gray-600">
              <div className="w-6 h-6 border-2 border-gray-300 border-top-[#0071E0] border-t-[#0071E0] rounded-full animate-spin"></div>
              <span className="text-base sm:text-lg font-medium">Loading...</span>
            </div>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-gray-600">Your cart is empty.</p>
            <button className="mt-6 px-6 py-3 rounded-lg bg-[#0071E0] text-white hover:bg-[#005bb5]" onClick={() => navigate('/ready-stock')}>Browse Products</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4"> 
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
                <div className="divide-y divide-gray-100">
                  {cartItems.map((item) => (
                    <div key={item.id} className="py-3 flex items-start gap-3">
                      <img
                        src={imageErrors[item.id] ? iphoneImage : item.imageUrl}
                        onError={() => handleImageError(item.id)}
                        alt={item.name}
                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                        <p className="text-xs text-gray-600 truncate">{item.description}</p>
                        <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">{convertPrice(item.price * item.quantity)}</p>
                        <p className="text-xs text-gray-500">({convertPrice(item.price)} x {item.quantity})</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

                          <div className="h-max bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <h3 className="text-base font-semibold text-gray-900 mb-3">Totals</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span className="font-medium text-gray-900">{convertPrice(totalPrice)}</span></div>
                
                {/* Display applied charges */}
                {costSummary.appliedCharges && costSummary.appliedCharges.length > 0 && (
                  <>
                    {costSummary.appliedCharges.map((charge, index) => (
                      <div key={index} className="flex justify-between items-start">
                        <span className="text-gray-600 capitalize">
                          {charge.type === 'ExtraDelivery' ? 'Extra Delivery' : charge.type}
                          {charge.costType === 'Percentage' && ` (${charge.value}%)`}
                        </span>
                        <span className="font-medium text-gray-900">{convertPrice(charge.calculatedAmount)}</span>
                      </div>
                    ))}
                  </>
                )}
                
                <div className="pt-3 mt-1 border-t border-gray-100 flex justify-between text-base">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="font-bold text-gray-900">{convertPrice(finalTotal)}</span>
                </div>
              </div>
            </div>
            </div>



            <div>
              <form onSubmit={handlePay} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-1 gap-4 sm:gap-6">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-3">Billing Address</h3>
                    <div className="space-y-3">
                      <input className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:border-[#0071E0] focus:ring-2 focus:ring-[#0071E0]/20" placeholder="Address" value={billingAddress.address} onChange={(e)=>handleAddressChange('billing','address',e.target.value)} required />
                      <input className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:border-[#0071E0] focus:ring-2 focus:ring-[#0071E0]/20" placeholder="City" value={billingAddress.city} onChange={(e)=>handleAddressChange('billing','city',e.target.value)} required />
                      <div className="flex gap-2">
                      <input className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:border-[#0071E0] focus:ring-2 focus:ring-[#0071E0]/20" placeholder="Postal Code" value={billingAddress.postalCode} onChange={(e)=>handleAddressChange('billing','postalCode',e.target.value)} required />
                      <select className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:border-[#0071E0] focus:ring-2 focus:ring-[#0071E0]/20" value={billingAddress.country} onChange={(e)=>handleAddressChange('billing','country',e.target.value)} required>
                        <option value="">Select Country</option>
                        <option value="Hongkong">Hongkong</option>
                        <option value="Dubai">Dubai</option>
                        <option value="Singapore">Singapore</option>
                        <option value="India">India</option>
                      </select>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-3">Shipping Address</h3>
                    <div className="space-y-3">
                      <input className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:border-[#0071E0] focus:ring-2 focus:ring-[#0071E0]/20" placeholder="Address" value={shippingAddress.address} onChange={(e)=>handleAddressChange('shipping','address',e.target.value)} required />
                      <input className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:border-[#0071E0] focus:ring-2 focus:ring-[#0071E0]/20" placeholder="City" value={shippingAddress.city} onChange={(e)=>handleAddressChange('shipping','city',e.target.value)} required />
                      <div className="flex gap-2">
                      <input className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:border-[#0071E0] focus:ring-2 focus:ring-[#0071E0]/20" placeholder="Postal Code" value={shippingAddress.postalCode} onChange={(e)=>handleAddressChange('shipping','postalCode',e.target.value)} required />
                      <select className="w-full p-2 rounded-lg border border-gray-200 focus:outline-none focus:border-[#0071E0] focus:ring-2 focus:ring-[#0071E0]/20" value={shippingAddress.country} onChange={(e)=>handleAddressChange('shipping','country',e.target.value)} required>
                        <option value="">Select Country</option>
                        <option value="Hongkong">Hongkong</option>
                        <option value="Dubai">Dubai</option>
                        <option value="Singapore">Singapore</option>
                        <option value="India">India</option>
                      </select>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-end">
                  <button type="button" className="w-full px-5 py-3 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50" onClick={()=>navigate('/cart')}>Back to Cart</button>
                  <button type="submit" disabled={isLoading} className="w-full px-6 py-3 rounded-lg bg-[#0071E0] text-white hover:bg-[#005bb5] disabled:opacity-50">{isLoading? 'Processing...' : 'Add Payment'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showPaymentPopup && currentOrder && (
          <PaymentPopup
            isOpen={showPaymentPopup}
            onClose={() => setShowPaymentPopup(false)}
            orderData={currentOrder}
            onSuccess={handlePaymentSuccess}
          />
        )}
      </div>
    </div>
  );
};

export default CheckoutPage;


