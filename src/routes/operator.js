


const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const supabase = require('../config/supabase');
const auth = require('../middleware/auth');

const operatorSignupValidation = [
  body('operator_name').trim().notEmpty().withMessage('Operator name is required'),
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['shop assistant', 'operator']).withMessage('Invalid role')
];

router.post('/signup', operatorSignupValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { operator_name, username, password, role } = req.body;

    // Check if operator exists
    const { data: existingOperator, error: existingError } = await supabase
      .from('operator')
      .select('*')
      .eq('username', username)
      .single();

    if (existingError && existingError.code !== 'PGRST116') { 
      // PGRST116 means no record found, which is fine
      return res.status(500).json({ message: 'Database error', error: existingError.message });
    }

    if (existingOperator) {
      return res.status(400).json({ message: 'Operator already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new operator
    const { data: newOperator, error: insertError } = await supabase
      .from('operator')
      .insert([{ operator_name, username, password_hash: hashedPassword, role, join_date: new Date() }])
      .select('*') // Ensure we get the inserted record
      .single();

    if (insertError) {
      return res.status(500).json({ message: 'Error inserting operator', error: insertError.message });
    }

    // Generate JWT
    const jwtSecret = process.env.JWT_SECRET || 'default_secret_key'; // Fallback for missing env
    const token = jwt.sign(
      { id: newOperator.id, username: newOperator.username, role: newOperator.role },
      jwtSecret,
      { expiresIn: '24h' }
    );

    return res.status(201).json({ message: 'Operator created successfully', token });
  } catch (error) {
    return res.status(500).json({ message: 'Error creating operator', error: error.message });
  }
});

router.post('/login', [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    // Validate request body
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    // Fetch user from Supabase
    const { data: operator, error: fetchError } = await supabase
      .from('operator')
      .select('*')
      .eq('username', username)
      .single();

    if (fetchError || !operator) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Compare password
    const validPassword = await bcrypt.compare(password, operator.password_hash);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET || 'default_secret_key';
    const token = jwt.sign(
      { id: operator.id, username: operator.username, role: operator.role },
      jwtSecret,
      { expiresIn: '24h' }
    );

    return res.json({ message: 'Login successful', token });

  } catch (error) {
    return res.status(500).json({ message: 'Login error', error: error.message });
  }
});


module.exports = router;
