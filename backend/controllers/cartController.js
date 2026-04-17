/**
 * Cart Controller
 * Handles shopping cart operations
 */

const Cart = require('../models/Cart');
const Event = require('../models/Event');
const { getTicketMetricsByEventIds } = require('../utils/ticketInventory');

const getEffectiveEventPrice = (event) => {
  const basePrice = Math.max(0, Number(event?.price) || 0);
  const discountPercent = Math.min(80, Math.max(0, Number(event?.discountPercent) || 0));
  return Number((basePrice * (1 - discountPercent / 100)).toFixed(2));
};

/**
 * Get user's cart
 * GET /api/cart
 */
exports.getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id }).populate('items.event');

    if (!cart) {
      cart = await Cart.create({ user: req.user.id, items: [], totalPrice: 0 });
    } else {
      // Clean up invalid items (e.g. if an event was deleted from DB)
      const validItems = cart.items.filter(item => item.event != null);
      if (validItems.length !== cart.items.length) {
        cart.items = validItems;
        cart.calculateTotal();
        await cart.save();
      }
    }

    res.status(200).json({
      success: true,
      cart,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add item to cart
 * POST /api/cart/add
 */
exports.addToCart = async (req, res, next) => {
  try {
    const { eventId, quantity } = req.body;

    // Validation
    if (!eventId || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Please provide event ID and quantity',
      });
    }

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // Check ticket availability
    const metricsByEvent = await getTicketMetricsByEventIds([eventId]);
    const metrics = metricsByEvent.get(String(event._id)) || { ticketsSold: 0, ticketsReserved: 0 };
    const availableTickets = event.ticketsAvailable - metrics.ticketsSold - metrics.ticketsReserved;
    if (quantity > availableTickets) {
      return res.status(400).json({
        success: false,
        message: `Only ${availableTickets} tickets available`,
      });
    }

    // Get or create cart
    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      cart = await Cart.create({ user: req.user.id, items: [] });
    }

    // Check if item already in cart
    const existingItem = cart.items.find((item) => item.event.toString() === eventId);
    const requestedTotalQty = existingItem ? existingItem.quantity + quantity : quantity;

    if (requestedTotalQty > availableTickets) {
      return res.status(400).json({
        success: false,
        message: `Only ${availableTickets} tickets available`,
      });
    }

    if (existingItem) {
      // Update quantity
      existingItem.quantity += quantity;
    } else {
      // Add new item
      cart.items.push({
        event: eventId,
        quantity,
        price: getEffectiveEventPrice(event),
      });
    }

    // Calculate total
    cart.calculateTotal();
    await cart.save();

    await cart.populate('items.event');

    res.status(200).json({
      success: true,
      message: 'Item added to cart',
      cart,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update cart item quantity
 * PUT /api/cart/update/:eventId
 */
exports.updateCartItem = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    const { eventId } = req.params;

    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be at least 1',
      });
    }

    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found',
      });
    }

    const item = cart.items.find((item) => item.event.toString() === eventId);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not in cart',
      });
    }

    // Check ticket availability
    const event = await Event.findById(eventId);
    const metricsByEvent = await getTicketMetricsByEventIds([eventId]);
    const metrics = metricsByEvent.get(String(event._id)) || { ticketsSold: 0, ticketsReserved: 0 };
    const availableTickets = event.ticketsAvailable - metrics.ticketsSold - metrics.ticketsReserved;

    if (quantity > availableTickets) {
      return res.status(400).json({
        success: false,
        message: `Only ${availableTickets} tickets available`,
      });
    }

    item.quantity = quantity;
    cart.calculateTotal();
    await cart.save();

    await cart.populate('items.event');

    res.status(200).json({
      success: true,
      message: 'Cart updated',
      cart,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove item from cart
 * DELETE /api/cart/remove/:eventId
 */
exports.removeFromCart = async (req, res, next) => {
  try {
    const { eventId } = req.params;

    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found',
      });
    }

    cart.items = cart.items.filter((item) => item.event.toString() !== eventId);
    cart.calculateTotal();
    await cart.save();

    await cart.populate('items.event');

    res.status(200).json({
      success: true,
      message: 'Item removed from cart',
      cart,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Clear entire cart
 * DELETE /api/cart/clear
 */
exports.clearCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found',
      });
    }

    cart.items = [];
    cart.totalPrice = 0;
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Cart cleared',
      cart,
    });
  } catch (error) {
    next(error);
  }
};
