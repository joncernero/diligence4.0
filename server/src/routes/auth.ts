import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { users } from '../schema/users';
import { eq } from 'drizzle-orm';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, role, department, orgId } = req.body;

    // Validation
    if (!email || !password || !firstName || !lastName || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if user exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.userEmail, email.toLowerCase()),
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const [newUser] = await db.insert(users).values({
      userEmail: email.toLowerCase(),
      userPasswordHash: passwordHash,
      userFirst: firstName,
      userLast: lastName,
      userRole: role,
      userDepartment: department || null,
      orgId: orgId || null,
    }).returning({
      id: users.id,
      email: users.userEmail,
      firstName: users.userFirst,
      lastName: users.userLast,
      role: users.userRole,
      department: users.userDepartment,
    });

    // Generate JWT
    const token = jwt.sign(
      {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        department: newUser.department,
      },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: newUser,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Find user
    const user = await db.query.users.findFirst({
      where: eq(users.userEmail, email.toLowerCase()),
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is inactive' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.userPasswordHash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await db.update(users)
      .set({ lastLogin: new Date() })
      .where(eq(users.id, user.id));

    // Generate JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.userEmail,
        role: user.userRole,
        department: user.userDepartment,
        orgId: user.orgId,
      },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.userEmail,
        firstName: user.userFirst,
        lastName: user.userLast,
        role: user.userRole,
        department: user.userDepartment,
        orgId: user.orgId,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

export { router as authRouter };
