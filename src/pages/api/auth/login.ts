import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { verifyPassword, generateToken } from '@/lib/auth';
import { withLogging } from '@/lib/apiHandler';
import logger from '@/lib/logger';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, password } = req.body;

    if (!username || !password) {
      logger.warn('Login attempt with missing credentials');
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      logger.auth('login', undefined, false);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      logger.auth('login', user.id, false);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken({ userId: user.id, username: user.username });

    logger.auth('login', user.id, true);
    
    res.status(200).json({
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        avatar: user.avatar,
        bio: user.bio,
      },
      token,
    });
  } catch (error) {
    logger.error('Login error', { error: error instanceof Error ? error.message : 'Unknown error' });
    res.status(500).json({ error: 'Internal server error' });
  }
}

export default withLogging(handler);



