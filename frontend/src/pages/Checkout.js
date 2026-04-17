import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import cartService from '../services/cartService';
import orderService from '../services/orderService';
import paymentService from '../services/paymentService';

const COUPON_MAP = {
  NEON20: { discountPercent: 20, owner: 'Neon Growth Squad' },
  KING20: { discountPercent: 20, owner: 'King Performance Media' },
  APDH20: { discountPercent: 20, owner: 'APDH Learning Labs' },
  THUG10: { discountPercent: 10, owner: 'Thug Conversion Studio' },
  DARE10: { discountPercent: 10, owner: 'Dare Digital House' },
  LEEP20: { discountPercent: 20, owner: 'LEEP Community Partners' },
};

const USER_PLATFORM_FEE_RATE = 0.02;

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existingScript = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true));
      existingScript.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const Checkout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [cart, setCart] = useState(null);

  useEffect(() => {
    loadRazorpayScript();
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const cartData = await cartService.getCart(token);
        setCart(cartData.cart);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const [formData, setFormData] = useState({
    attendeeName: user?.name || '',
    attendeeEmail: user?.email || '',
    attendeePhone: '',
    street: '',
    city: '',
    stateZip: '',
    country: 'India',
  });

  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [neftReferenceNumber, setNeftReferenceNumber] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCouponCode, setAppliedCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNeftSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      setPaymentStatus('Processing NEFT bank transfer order...');
      const token = localStorage.getItem('token');

      const checkoutPayload = {
        attendeeName: formData.attendeeName,
        attendeeEmail: formData.attendeeEmail,
        attendeePhone: formData.attendeePhone,
        billingAddress: {
          street: formData.street,
          city: formData.city,
          state: formData.stateZip,
          postalCode: formData.stateZip,
          country: formData.country,
        },
        paymentMethod: 'neft',
        neftReferenceNumber: neftReferenceNumber,
        couponCode: appliedCouponCode,
      };

      const checkoutRes = await orderService.checkout(checkoutPayload, token);
      await cartService.clearCart(token);
      navigate(`/order-confirmation/${checkoutRes.order._id}`);
    } catch (err) {
      setError(err.message || err?.message || 'NEFT checkout failed');
      setLoading(false);
      setPaymentStatus('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      setPaymentStatus('Initializing secure checkout...');
      const token = localStorage.getItem('token');

      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        throw new Error('Razorpay SDK failed to load. Are you online?');
      }

      const orderData = await paymentService.createOrder(token, {
        couponCode: appliedCouponCode,
      });
      setPaymentStatus('Awaiting payment completion...');

      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID || orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Virtual Event Ticketing',
        description: 'Ticket Purchase',
        order_id: orderData.order.id,
        handler: async function (response) {
          try {
            setLoading(true);
            setPaymentStatus('Payment successful! Verifying payment...');

            await paymentService.verifyPayment(
              {
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                razorpaySignature: response.razorpay_signature,
              },
              token
            );

            setPaymentStatus('Payment verified! Creating order...');

            const checkoutPayload = {
              attendeeName: formData.attendeeName,
              attendeeEmail: formData.attendeeEmail,
              attendeePhone: formData.attendeePhone,
              billingAddress: {
                street: formData.street,
                city: formData.city,
                state: formData.stateZip,
                postalCode: formData.stateZip,
                country: formData.country,
              },
              paymentMethod: 'razorpay',
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
              couponCode: appliedCouponCode,
            };
            const checkoutRes = await orderService.checkout(checkoutPayload, token);
            await cartService.clearCart(token);
            navigate(`/order-confirmation/${checkoutRes.order._id}`);
          } catch (err) {
            setError(err.message || 'Order completion failed after payment.');
            setLoading(false);
            setPaymentStatus('');
          }
        },
        prefill: {
          name: formData.attendeeName,
          email: formData.attendeeEmail,
          contact: formData.attendeePhone,
        },
        theme: {
          color: '#e9208f',
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            setPaymentStatus('');
            setError('Payment cancelled by user.');
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        setError(response.error.description || 'Payment failed.');
        setLoading(false);
        setPaymentStatus('');
      });
      rzp.open();
    } catch (err) {
      setError(err.message || err?.message || 'Checkout failed');
      setLoading(false);
      setPaymentStatus('');
    }
  };

  const subtotal =
    cart?.items?.reduce((total, item) => total + item.price * item.quantity, 0) || 0;
  const appliedCoupon = COUPON_MAP[appliedCouponCode] || null;
  const couponDiscountAmount = appliedCoupon
    ? Number(((subtotal * appliedCoupon.discountPercent) / 100).toFixed(2))
    : 0;
  const discountedSubtotal = Number((subtotal - couponDiscountAmount).toFixed(2));
  const userPlatformFee = Number((discountedSubtotal * USER_PLATFORM_FEE_RATE).toFixed(2));
  const orderTotal = Number((discountedSubtotal + userPlatformFee).toFixed(2));

  const handleApplyCoupon = () => {
    const normalizedCode = String(couponCode || '').trim().toUpperCase();
    if (!normalizedCode) {
      setAppliedCouponCode('');
      setCouponError('');
      return;
    }

    if (!COUPON_MAP[normalizedCode]) {
      setCouponError('Invalid coupon code. Please check and try again.');
      return;
    }

    setAppliedCouponCode(normalizedCode);
    setCouponError('');
  };

  return (
    <div>
      <main className="mx-auto max-w-[1200px] px-6 py-10">
        <div className="mb-8">
          <nav className="mb-4 flex items-center gap-2 text-sm text-slate-400">
            <Link to="/events" className="transition-colors hover:text-primary">
              Events
            </Link>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="text-white">Checkout</span>
          </nav>
          <span className="mb-2 block text-xs font-black uppercase tracking-[0.2em] text-primary">
            Checkout
          </span>
          <h1 className="text-4xl font-black text-white md:text-5xl">Complete Your Order</h1>
        </div>

        <div className="relative mb-12 flex max-w-2xl items-center justify-between">
          <div className="absolute left-0 top-5 -z-0 h-[2px] w-full bg-input-border">
            <div className="h-full w-1/2 bg-primary"></div>
          </div>
          <div className="z-10 flex flex-col items-center gap-2">
            <div className="flex size-10 items-center justify-center rounded-full bg-primary text-white">
              <span className="material-symbols-outlined">check</span>
            </div>
            <span className="text-sm font-bold text-primary">Details</span>
          </div>
          <div className="z-10 flex flex-col items-center gap-2">
            <div className="flex size-10 items-center justify-center rounded-full border-4 border-background-dark bg-primary text-white">
              <span className="text-sm font-bold">2</span>
            </div>
            <span className="text-sm font-bold text-primary">Payment</span>
          </div>
          <div className="z-10 flex flex-col items-center gap-2">
            <div className="flex size-10 items-center justify-center rounded-full border border-input-border bg-surface text-slate-500">
              <span className="text-sm font-bold">3</span>
            </div>
            <span className="text-sm font-bold text-slate-500">Confirmation</span>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}
        
        {paymentStatus && (
           <div className="mb-6 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
             {paymentStatus}
           </div>
        )}

        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-7">
            <div className="rounded-2xl border border-input-border bg-surface p-8">
              <form onSubmit={handleSubmit}>
                <div className="mb-10">
                  <div className="mb-6 flex items-center gap-2">
                     <span className="material-symbols-outlined text-primary">person</span>
                     <h2 className="text-xl font-bold text-white">Contact Information</h2>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="col-span-2">
                      <label className="mb-2 block text-xs font-bold uppercase text-slate-400">
                        Full Name
                      </label>
                      <input
                        className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
                        type="text"
                        name="attendeeName"
                        value={formData.attendeeName}
                        onChange={handleInputChange}
                        placeholder="John Doe"
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase text-slate-400">
                        Email Address
                      </label>
                      <input
                        className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
                        type="email"
                        name="attendeeEmail"
                        value={formData.attendeeEmail}
                        onChange={handleInputChange}
                        placeholder="john@example.com"
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase text-slate-400">
                        Phone Number
                      </label>
                      <input
                        className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
                        type="tel"
                        name="attendeePhone"
                        value={formData.attendeePhone}
                        onChange={handleInputChange}
                        placeholder="+1 (555) 000-0000"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="mb-8">
                  <div className="mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">location_on</span>
                    <h2 className="text-xl font-bold text-white">Billing Address</h2>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="md:col-span-3">
                      <label className="mb-2 block text-xs font-bold uppercase text-slate-400">
                        Street Address
                      </label>
                      <input
                        className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
                        type="text"
                        name="street"
                        value={formData.street}
                        onChange={handleInputChange}
                        placeholder="123 Event St"
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase text-slate-400">
                        City
                      </label>
                      <input
                        className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        placeholder="Bengaluru"
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase text-slate-400">
                        State / Zip
                      </label>
                      <input
                        className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
                        type="text"
                        name="stateZip"
                        value={formData.stateZip}
                        onChange={handleInputChange}
                        placeholder="Karnataka 560001"
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-xs font-bold uppercase text-slate-400">
                        Country
                      </label>
                      <input
                        className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
                        type="text"
                        name="country"
                        value={formData.country}
                        onChange={handleInputChange}
                        placeholder="India"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="mb-6 flex items-center gap-2">
                   <span className="material-symbols-outlined text-primary">payments</span>
                   <h2 className="text-xl font-bold text-white">Payment Method</h2>
                </div>

                <div className="mb-6 grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('razorpay')}
                    className={`flex flex-col items-center justify-center rounded-xl border p-4 transition-all ${
                      paymentMethod === 'razorpay'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-white/10 text-slate-400 hover:border-white/30'
                    }`}
                  >
                    <span className="material-symbols-outlined text-2xl mb-2">onlinePayments</span>
                    <span className="font-bold text-sm">Online Checkout</span>
                    <span className="text-xs text-slate-500">(Razorpay)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('neft')}
                    className={`flex flex-col items-center justify-center rounded-xl border p-4 transition-all ${
                      paymentMethod === 'neft'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-white/10 text-slate-400 hover:border-white/30'
                    }`}
                  >
                    <span className="material-symbols-outlined text-2xl mb-2">accountBalance</span>
                    <span className="font-bold text-sm">Bank Transfer</span>
                    <span className="text-xs text-slate-500">(NEFT)</span>
                  </button>
                </div>

                <div className="mb-6 rounded-lg border border-white/10 bg-black/20 p-4">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold uppercase tracking-wide text-white">Coupon Code</h3>
                    {appliedCoupon && (
                      <span className="text-xs text-emerald-300">
                        {appliedCoupon.discountPercent}% off applied
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Enter coupon code"
                      className="flex-1 rounded-lg border border-white/10 bg-black/40 px-4 py-2 text-sm text-white outline-none focus:border-primary"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      className="rounded-lg border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary"
                    >
                      Apply
                    </button>
                  </div>
                  {couponError && <p className="mt-2 text-xs text-red-300">{couponError}</p>}
                </div>

                {paymentMethod === 'neft' && (
                  <div className="mb-6 rounded-lg border border-amber-400/30 bg-amber-500/10 p-4">
                    <div className="mb-4 flex items-center gap-2">
                      <span className="material-symbols-outlined text-amber-400">info</span>
                      <h3 className="font-bold text-amber-200">Bank Transfer Details</h3>
                    </div>
                    <div className="mb-4 space-y-2 text-sm text-slate-300">
                      <p><span className="font-semibold">Bank Name:</span> State Bank of India</p>
                      <p><span className="font-semibold">Account Number:</span> 1234567890</p>
                      <p><span className="font-semibold">IFSC Code:</span> SBIN0001234</p>
                      <p><span className="font-semibold">Account Name:</span> Virtual Events Pvt Ltd</p>
                    </div>
                    <div className="mb-2">
                      <label className="mb-2 block text-xs font-bold uppercase text-slate-400">
                        UTR / Reference Number
                      </label>
                      <input
                        className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-3 text-white outline-none transition-all focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                        type="text"
                        name="neftReferenceNumber"
                        value={neftReferenceNumber}
                        onChange={(e) => setNeftReferenceNumber(e.target.value)}
                        placeholder="Enter your UTR number after transfer"
                        required
                      />
                    </div>
                    <p className="text-xs text-slate-400">
                      Please transfer the exact amount to the above account and enter your UTR number to verify the payment.
                    </p>
                  </div>
                )}

                {paymentMethod === 'razorpay' && (
                  <div className="mb-8 rounded-lg border border-primary/40 bg-primary/10 p-4 text-center">
                      <p className="text-slate-300">Proceed to standard checkout via Razorpay (UPI, Credit Cards, Wallets securely supported)</p>
                  </div>
                )}

                {paymentMethod === 'neft' ? (
                  <button
                    className="mb-4 w-full rounded-full bg-amber-500 py-4 text-lg font-black text-black shadow-[0_0_20px_rgba(233,32,143,0.3)] transition-all hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
                    type="button"
                    onClick={handleNeftSubmit}
                    disabled={loading || !neftReferenceNumber}
                  >
                    {loading ? 'Processing...' : `Place Order (Pay ₹${orderTotal.toFixed(2)})`}
                  </button>
                ) : (
                  <button
                    className="mb-4 w-full rounded-full bg-primary py-4 text-lg font-black text-white shadow-[0_0_20px_rgba(233,32,143,0.3)] transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : `Pay ₹${orderTotal.toFixed(2)}`}
                  </button>
                )}

                <p className="flex items-center justify-center gap-2 text-center text-sm text-slate-500">
                  {paymentMethod === 'razorpay' ? (
                    <>
                      <span className="material-symbols-outlined text-xs">lock</span>
                      Your payment is secured with 256-bit SSL encryption via Razorpay
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-xs">info</span>
                      Payment will be verified by admin after UTR confirmation
                    </>
                  )}
                </p>
              </form>
            </div>
          </div>

          <div className="sticky top-28 lg:col-span-5">
            <div className="overflow-hidden rounded-2xl border border-input-border bg-surface">
              <div className="p-8">
                <h2 className="mb-6 text-2xl font-bold text-white">Order Summary</h2>
                {cart && cart.items.length > 0 ? (
                  <div className="mb-8 space-y-4 border-b border-input-border pb-8">
                    {cart.items.map((item, idx) => (
                      <div key={idx} className="flex flex-col gap-2">
                         <div className="flex items-center justify-between">
                           <span className="text-slate-400">{item.event?.title || 'General Admission'} x{item.quantity}</span>
                           <span className="font-medium text-white">₹{(item.price * item.quantity).toFixed(2)}</span>
                         </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mb-8 text-slate-500">Cart is empty.</p>
                )}

                <div className="mb-8 space-y-3">
                  <div className="flex items-center justify-between text-sm text-slate-400">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-emerald-300">
                    <span>Coupon Discount {appliedCoupon ? `(${appliedCouponCode})` : ''}</span>
                    <span>-₹{couponDiscountAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-amber-300">
                    <span>User Platform Fee (2%)</span>
                    <span>₹{userPlatformFee.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between pt-4">
                    <span className="text-xl font-bold text-white">Total</span>
                    <span className="text-3xl font-black text-primary">₹{orderTotal.toFixed(2)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col items-center rounded-xl border border-input-border bg-input-fill/50 p-3 text-center">
                    <span className="material-symbols-outlined mb-1 text-xl text-primary">verified_user</span>
                    <span className="text-[10px] font-bold uppercase leading-tight text-slate-400">
                      Secure Payment
                    </span>
                  </div>
                  <div className="flex flex-col items-center rounded-xl border border-input-border bg-input-fill/50 p-3 text-center">
                    <span className="material-symbols-outlined mb-1 text-xl text-primary">payments</span>
                    <span className="text-[10px] font-bold uppercase leading-tight text-slate-400">
                      Razorpay
                    </span>
                  </div>
                  <div className="flex flex-col items-center rounded-xl border border-input-border bg-input-fill/50 p-3 text-center">
                    <span className="material-symbols-outlined mb-1 text-xl text-primary">send_to_mobile</span>
                    <span className="text-[10px] font-bold uppercase leading-tight text-slate-400">
                      Instant Delivery
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Checkout;
