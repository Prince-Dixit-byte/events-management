import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { getDb } from '../db/database.ts';
import { requireAuth, signToken, toSafeUser } from '../middleware/auth.ts';
import { AppError } from '../middleware/errorHandler.ts';
import type { UserRow } from '../types.ts';

const router = Router();

router.post('/register', (req, res, next) => {
  try {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const department =
      typeof req.body?.department === 'string' && req.body.department.trim()
        ? req.body.department.trim()
        : 'Computer Science & Engineering';

    const errors: Record<string, string> = {};
    if (name.length < 2) errors.name = 'Full name must be at least 2 characters.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please provide a valid email address.';
    }
    if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters long.';
    }

    if (Object.keys(errors).length > 0) {
      throw new AppError(400, 'Registration details are invalid.', 'VALIDATION_ERROR', errors);
    }

    const db = getDb();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email) as
      | { id: number }
      | undefined;
    if (existing) {
      throw new AppError(409, 'An account with this email already exists.', 'EMAIL_EXISTS');
    }

    // Security rule: Never trust a client-supplied role during public registration.
    const assignedRole = 'STUDENT';
    const passwordHash = bcrypt.hashSync(password, 10);

    const result = db
      .prepare(
        `INSERT INTO users (name, email, password_hash, role, department)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(name, email, passwordHash, assignedRole, department);

    const createdRow = db
      .prepare('SELECT * FROM users WHERE id = ?')
      .get(Number(result.lastInsertRowid)) as unknown as UserRow;

    const user = toSafeUser(createdRow);
    const token = signToken(user);

    res.status(201).json({
      token,
      user,
      message: 'Student account registered successfully.',
    });
  } catch (err) {
    next(err);
  }
});

router.post('/login', (req, res, next) => {
  try {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';

    if (!email || !password) {
      throw new AppError(400, 'Email and password are required.', 'VALIDATION_ERROR');
    }

    const db = getDb();
    const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as UserRow | undefined;

    if (!row || !bcrypt.compareSync(password, row.password_hash)) {
      throw new AppError(401, 'Invalid email or password.', 'INVALID_CREDENTIALS');
    }

    const user = toSafeUser(row);
    const token = signToken(user);

    res.status(200).json({
      token,
      user,
      message: 'Authenticated successfully.',
    });
  } catch (err) {
    next(err);
  }
});

router.get('/me', requireAuth, (req, res) => {
  res.status(200).json({ user: req.user });
});

export default router;
