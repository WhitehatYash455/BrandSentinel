import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/connection.js';
import { generateToken, AuthRequest } from '../middleware/auth.js';
import { recordAuditLog } from '../middleware/audit.js';

export function register(req: Request, res: Response): void {
  const { email, password, fullName, role } = req.body;

  if (!email || !password || !fullName || !role) {
    res.status(400).json({ error: 'Missing required registration fields' });
    return;
  }

  const validRoles = ['CONTENT_CREATOR', 'HUMAN_REVIEWER', 'BRAND_ADMIN'];
  if (!validRoles.includes(role)) {
    res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
    return;
  }

  const existing = db.prepare(`SELECT id FROM users WHERE email = ?`).get(email);
  if (existing) {
    res.status(409).json({ error: 'User with this email already exists' });
    return;
  }

  const userId = 'usr_' + uuidv4().slice(0, 16);
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);

  db.prepare(`
    INSERT INTO users (id, email, password_hash, full_name, role)
    VALUES (?, ?, ?, ?, ?)
  `).run(userId, email, passwordHash, fullName, role);

  const defaultBrand = db.prepare(`SELECT id FROM brands LIMIT 1`).get() as any;
  if (defaultBrand) {
    db.prepare(`
      INSERT INTO brand_members (id, brand_id, user_id, role)
      VALUES (?, ?, ?, ?)
    `).run(uuidv4(), defaultBrand.id, userId, role);
  }

  const token = generateToken({ id: userId, email, fullName, role });

  recordAuditLog({
    userId,
    action: 'USER_REGISTERED',
    metadata: { email, role }
  });

  res.status(201).json({
    token,
    user: { id: userId, email, fullName, role }
  });
}

export function login(req: Request, res: Response): void {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  const user = db.prepare(`SELECT * FROM users WHERE email = ?`).get(email) as any;
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const token = generateToken({
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    role: user.role
  });

  recordAuditLog({
    userId: user.id,
    action: 'USER_LOGGED_IN',
    metadata: { role: user.role }
  });

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      avatarUrl: user.avatar_url
    }
  });
}

export function getMe(req: AuthRequest, res: Response): void {
  if (!req.user) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const user = db.prepare(`SELECT id, email, full_name, role, avatar_url, created_at FROM users WHERE id = ?`).get(req.user.id) as any;
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const brand = db.prepare(`
    SELECT b.* FROM brands b
    JOIN brand_members bm ON b.id = bm.brand_id
    WHERE bm.user_id = ?
    LIMIT 1
  `).get(user.id);

  res.json({
    user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      avatarUrl: user.avatar_url,
      brand
    }
  });
}

// Quick Switcher API for instant hackathon role evaluation
export function switchDemoRole(req: Request, res: Response): void {
  const { role } = req.body;
  const user = db.prepare(`SELECT * FROM users WHERE role = ? LIMIT 1`).get(role) as any;
  if (!user) {
    res.status(404).json({ error: `No demo user found for role ${role}` });
    return;
  }

  const token = generateToken({
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    role: user.role
  });

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      avatarUrl: user.avatar_url
    }
  });
}

