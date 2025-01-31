const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const supabase = require('../config/supabase');

// Validation
const itemValidation = [
  body('name').trim().notEmpty().withMessage('Item name is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('shop_id').notEmpty().withMessage('Shop ID is required')
];

// Create item (shop owner only)
router.post('/', 
  auth(['shop_owner']),
  itemValidation,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, price, shop_id } = req.body;

      // Verify shop ownership
      const { data: shop } = await supabase
        .from('shops')
        .select('*')
        .eq('id', shop_id)
        .eq('owner_id', req.user.id)
        .single();

      if (!shop) {
        return res.status(403).json({ message: 'Not authorized to add items to this shop' });
      }

      const { data: item, error } = await supabase
        .from('items')
        .insert([{ name, price, shop_id }])
        .select()
        .single();

      if (error) throw error;

      res.status(201).json(item);
    } catch (error) {
      res.status(500).json({ message: 'Error creating item', error: error.message });
    }
});

// Get items by shop
router.get('/shop/:shopId', auth(), async (req, res) => {
  try {
    const { shopId } = req.params;

    const { data: items, error } = await supabase
      .from('items')
      .select('*')
      .eq('shop_id', shopId);

    if (error) throw error;

    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching items', error: error.message });
  }
});

module.exports = router;