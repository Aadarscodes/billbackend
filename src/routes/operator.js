// const express = require('express');
// const router = express.Router();
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const { body, validationResult } = require('express-validator');
// const supabase = require('../config/supabase');

// // Operator signup validation
// const operatorSignupValidation = [
//   body('operator_name').trim().notEmpty().withMessage('Operator name is required'),
//   body('username').trim().notEmpty().withMessage('Username is required'),
//   body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
//   body('role').isIn(['shop assistant', 'operator']).withMessage('Invalid role')
// ];

// // Operator login validation
// const operatorLoginValidation = [
//   body('username').trim().notEmpty().withMessage('Username is required'),
//   body('password').notEmpty().withMessage('Password is required')
// ];

// // Operator Signup Route
// router.post('/signup', operatorSignupValidation, async (req, res) => {
//   try {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({ errors: errors.array() });
//     }

//     const { operator_name, username, password, role } = req.body;
    
//     // Check if operator exists
//     const { data: existingOperator } = await supabase
//       .from('operators')
//       .select('*')
//       .eq('username', username)
//       .single();

//     if (existingOperator) {
//       return res.status(400).json({ message: 'Operator already exists' });
//     }

//     // Hash password
//     const hashedPassword = await bcrypt.hash(password, 10);

//     // Create operator
//     const { data: newOperator, error } = await supabase
//       .from('operators')
//       .insert([
//         { operator_name, username, password_hash: hashedPassword, role, join_date: new Date() }
//       ])
//       .select()
//       .single();

//     if (error) throw error;

//     // Generate JWT
//     const token = jwt.sign(
//       { id: newOperator.id, username: newOperator.username, role: newOperator.role },
//       process.env.JWT_SECRET,
//       { expiresIn: '24h' }
//     );

//     res.status(201).json({ token });
//   } catch (error) {
//     res.status(500).json({ message: 'Error creating operator', error: error.message });
//   }
// });

// // Operator Login Route
// router.post('/login', operatorLoginValidation, async (req, res) => {
//   try {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({ errors: errors.array() });
//     }

//     const { username, password } = req.body;

//     // Find operator
//     const { data: operator, error } = await supabase
//       .from('operators')
//       .select('*')
//       .eq('username', username)
//       .single();

//     if (error || !operator) {
//       return res.status(401).json({ message: 'Invalid credentials' });
//     }

//     // Check password
//     const validPassword = await bcrypt.compare(password, operator.password_hash);
//     if (!validPassword) {
//       return res.status(401).json({ message: 'Invalid credentials' });
//     }

//     // Generate JWT
//     const token = jwt.sign(
//       { id: operator.id, username: operator.username, role: operator.role },
//       process.env.JWT_SECRET,
//       { expiresIn: '24h' }
//     );

//     res.json({ token });
//   } catch (error) {
//     res.status(500).json({ message: 'Login error', error: error.message });
//   }
// });

// module.exports = router;

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const supabase = require('../config/supabase');
const auth = require('../middleware/auth');

// Operator signup validation
const operatorSignupValidation = [
  body('operator_name').trim().notEmpty().withMessage('Operator name is required'),
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['shop assistant', 'operator']).withMessage('Invalid role')
];

// Operator login validation
const operatorLoginValidation = [
  body('username').trim().notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
];

// Operator Signup Route
router.post('/signup', operatorSignupValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { operator_name, username, password, role } = req.body;
    
    // Check if operator exists
    const { data: existingOperator } = await supabase
      .from('operators')
      .select('*')
      .eq('username', username)
      .single();

    if (existingOperator) {
      return res.status(400).json({ message: 'Operator already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create operator
    const { data: newOperator, error } = await supabase
      .from('operators')
      .insert([
        { operator_name, username, password_hash: hashedPassword, role, join_date: new Date() }
      ])
      .select()
      .single();

    if (error) throw error;

    // Generate JWT
    const token = jwt.sign(
      { id: newOperator.id, username: newOperator.username, role: newOperator.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({ token });
  } catch (error) {
    res.status(500).json({ message: 'Error creating operator', error: error.message });
  }
});

// Operator Login Route
router.post('/login', operatorLoginValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    // Find operator
    const { data: operator, error } = await supabase
      .from('operators')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !operator) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, operator.password_hash);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: operator.id, username: operator.username, role: operator.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: 'Login error', error: error.message });
  }
});

// Protected Route Example
router.get('/profile', auth(['operator', 'shop assistant']), async (req, res) => {
  try {
    const { id } = req.user;
    const { data: operator, error } = await supabase
      .from('operator')
      .select('id, operator_name, username, role, join_date')
      .eq('id', id)
      .single();

    if (error || !operator) {
      return res.status(404).json({ message: 'Operator not found' });
    }

    res.json(operator);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
});

module.exports = router;
