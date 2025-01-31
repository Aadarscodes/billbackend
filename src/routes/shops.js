const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const supabase = require('../config/supabase');

// Validation
const shopValidation = [
  body('name').trim().notEmpty().withMessage('Shop name is required')
];

// Create shop (super admin only)
router.post('/', 
  auth(['super_admin']),
  shopValidation,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, owner_id } = req.body;

      const { data: shop, error } = await supabase
        .from('shops')
        .insert([{ name, owner_id }])
        .select()
        .single();

      if (error) throw error;

      res.status(201).json(shop);
    } catch (error) {
      res.status(500).json({ message: 'Error creating shop', error: error.message });
    }
});

// Get all shops
router.get('/', auth(), async (req, res) => {
  try {
    const { data: shops, error } = await supabase
      .from('shops')
      .select('*');

    if (error) throw error;

    res.json(shops);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching shops', error: error.message });
  }
});

module.exports = router;