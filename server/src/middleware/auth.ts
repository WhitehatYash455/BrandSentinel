import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'brand_sentinel_super_secret_jwt_key_2026_titans';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: 'CONTENT_CREATOR' | 'HUMAN_REVIEWER' | 'BRAND_ADMIN';
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
    return;
  }
}

export function requireRole(...allowedRoles: Array<'CONTENT_CREATOR' | 'HUMAN_REVIEWER' | 'BRAND_ADMIN'>) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized: Not authenticated' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `Forbidden: Access requires one of [${allowedRoles.join(', ')}]. Current role: ${req.user.role}`
      });
      return;
    }

    next();
  };
}

