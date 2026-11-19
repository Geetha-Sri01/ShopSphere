const crypto = require('crypto');
const { pool, query } = require('../config/db');

// Ensure password_hash column exists in PostgreSQL customers table if database is active
let tableChecked = false;
async function ensureAuthColumns() {
  if (tableChecked || !pool) return;
  try {
    await query(`
      ALTER TABLE customers ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
      ALTER TABLE customers ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'customer';
    `);
    tableChecked = true;
  } catch (err) {
    // Non-critical if table alteration is restricted or already exists
    tableChecked = true;
  }
}

// In-memory demo accounts for instant hackathon testing and fallback
const DEMO_USERS = [
  {
    id: 'cust_01',
    name: 'Aarav Sharma',
    email: 'aarav@example.in',
    phone: '9876543210',
    address: '42 MG Road, Indiranagar',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560038',
    role: 'customer',
    passwordHash: crypto.createHash('sha256').update('password123').digest('hex')
  },
  {
    id: 'admin_01',
    name: 'ShopSphere Operations Admin',
    email: 'admin@shopsphere.in',
    phone: '9988776655',
    address: 'ShopSphere Retail Hub, BKC',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400051',
    role: 'admin',
    passwordHash: crypto.createHash('sha256').update('admin123').digest('hex')
  }
];

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Customer & Admin Login
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email address and password.'
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();
    const hashed = hashPassword(cleanPassword);

    await ensureAuthColumns();

    // 1. Check in-memory demo accounts first
    const demoUser = DEMO_USERS.find(u => u.email === cleanEmail);
    if (demoUser) {
      if (demoUser.passwordHash === hashed || cleanPassword === 'password123' || cleanPassword === 'admin123') {
        const { passwordHash, ...safeUser } = demoUser;
        return res.json({
          success: true,
          message: `Welcome back, ${safeUser.name}!`,
          token: `token_${safeUser.id}_${Date.now()}`,
          user: safeUser
        });
      } else {
        return res.status(401).json({
          success: false,
          message: 'Invalid password. Try "password123" for demo account.'
        });
      }
    }

    // 2. Check in Aiven PostgreSQL customers table
    if (pool) {
      try {
        const result = await query(
          'SELECT id, name, email, phone, address, city, state, pincode, role, password_hash FROM customers WHERE LOWER(email) = $1 LIMIT 1',
          [cleanEmail]
        );

        if (result.rows.length > 0) {
          const dbCust = result.rows[0];
          // If customer has a password_hash, verify it; if not (e.g. from previous checkout), allow login with provided password
          if (!dbCust.password_hash || dbCust.password_hash === hashed) {
            const { password_hash, ...safeUser } = dbCust;
            return res.json({
              success: true,
              message: `Welcome back, ${safeUser.name}!`,
              token: `token_${safeUser.id}_${Date.now()}`,
              user: {
                ...safeUser,
                role: safeUser.role || 'customer'
              }
            });
          } else {
            return res.status(401).json({
              success: false,
              message: 'Invalid password. Please check your credentials.'
            });
          }
        }
      } catch (dbErr) {
        console.warn('[AUTH] Database customer query error:', dbErr.message);
      }
    }

    // Default friendly fallback for testing any credentials
    return res.json({
      success: true,
      message: `Welcome to ShopSphere, ${cleanEmail.split('@')[0]}!`,
      token: `token_usr_${Date.now()}`,
      user: {
        id: `user_${Date.now().toString().slice(-4)}`,
        name: cleanEmail.split('@')[0].replace('.', ' ').replace(/^./, str => str.toUpperCase()),
        email: cleanEmail,
        phone: '9876543210',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560001',
        role: cleanEmail.includes('admin') ? 'admin' : 'customer'
      }
    });

  } catch (err) {
    next(err);
  }
}

/**
 * Customer Registration / Sign Up
 */
async function register(req, res, next) {
  try {
    const { name, email, phone, password, address, city, state, pincode } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide your full name.' });
    }
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = (phone || '9876543210').replace(/\D/g, '');
    const cleanName = name.trim();
    const hashed = hashPassword(password);

    await ensureAuthColumns();

    let newId = `cust_${Date.now().toString().slice(-4)}`;

    // Insert into Aiven PostgreSQL customers table if available
    if (pool) {
      try {
        const existing = await query('SELECT id FROM customers WHERE LOWER(email) = $1 LIMIT 1', [cleanEmail]);
        if (existing.rows.length > 0) {
          return res.status(400).json({
            success: false,
            message: 'An account with this email already exists. Please log in.'
          });
        }

        const insertRes = await query(
          `INSERT INTO customers (name, email, phone, address, city, state, pincode, password_hash, role)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           RETURNING id, name, email, phone, address, city, state, pincode, role`,
          [
            cleanName,
            cleanEmail,
            cleanPhone,
            address || 'Customer Delivery Address',
            city || 'Bengaluru',
            state || 'Karnataka',
            pincode || '560001',
            hashed,
            'customer'
          ]
        );

        if (insertRes.rows.length > 0) {
          const created = insertRes.rows[0];
          return res.status(201).json({
            success: true,
            message: `Account created successfully! Welcome to ShopSphere, ${cleanName}.`,
            token: `token_${created.id}_${Date.now()}`,
            user: created
          });
        }
      } catch (dbErr) {
        console.warn('[AUTH] Error inserting customer into PostgreSQL:', dbErr.message);
      }
    }

    // Fallback registration memory object
    const newUser = {
      id: newId,
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      address: address || 'Customer Delivery Address',
      city: city || 'Bengaluru',
      state: state || 'Karnataka',
      pincode: pincode || '560001',
      role: 'customer'
    };

    DEMO_USERS.push({
      ...newUser,
      passwordHash: hashed
    });

    return res.status(201).json({
      success: true,
      message: `Account created successfully! Welcome to ShopSphere, ${cleanName}.`,
      token: `token_${newUser.id}_${Date.now()}`,
      user: newUser
    });

  } catch (err) {
    next(err);
  }
}

/**
 * Get Current User Profile
 */
async function getMe(req, res) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  // Demo user lookup from mock list
  const user = DEMO_USERS[0];
  const { passwordHash, ...safeUser } = user;
  res.json({ success: true, user: safeUser });
}

module.exports = {
  login,
  register,
  getMe,
  DEMO_USERS
};
