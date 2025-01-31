const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const supabase = require('../config/supabase');

// Validation
const invoiceValidation = [
  body('shop_id').notEmpty().withMessage('Shop ID is required'),
  body('customer_id').notEmpty().withMessage('Customer ID is required'),
  body('total_amount').isFloat({ min: 0 }).withMessage('Total amount must be a positive number')
];

// Create invoice (shop owner only)
router.post('/', 
  auth(['shop_owner']),
  invoiceValidation,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { shop_id, customer_id, total_amount } = req.body;

      // Verify shop ownership
      const { data: shop } = await supabase
        .from('shops')
        .select('*')
        .eq('id', shop_id)
        .eq('owner_id', req.user.id)
        .single();

      if (!shop) {
        return res.status(403).json({ message: 'Not authorized to create invoices for this shop' });
      }

      const { data: invoice, error } = await supabase
        .from('invoices')
        .insert([{ shop_id, customer_id, total_amount }])
        .select()
        .single();

      if (error) throw error;

      res.status(201).json(invoice);
    } catch (error) {
      res.status(500).json({ message: 'Error creating invoice', error: error.message });
    }
});

// Get invoices (filtered by role)
router.get('/', auth(), async (req, res) => {
  try {
    let query = supabase.from('invoices').select('*');

    // Filter based on user role
    if (req.user.role === 'customer') {
      query = query.eq('customer_id', req.user.id);
    } else if (req.user.role === 'shop_owner') {
      const { data: shops } = await supabase
        .from('shops')
        .select('id')
        .eq('owner_id', req.user.id);
      
      const shopIds = shops.map(shop => shop.id);
      query = query.in('shop_id', shopIds);
    }

    const { data: invoices, error } = await query;

    if (error) throw error;

    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching invoices', error: error.message });
  }
});

module.exports = router;