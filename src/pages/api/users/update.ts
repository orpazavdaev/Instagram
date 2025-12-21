import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const payload = getUserFromRequest(req);
  if (!payload) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { fullName, username, bio, avatar } = req.body;

    // Check if username is already taken (if changed)
    if (username && username !== payload.username) {
      const existingUser = await prisma.user.findUnique({
        where: { username },
      });
      
      if (existingUser) {
        return res.status(400).json({ error: 'Username already taken' });
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: payload.userId },
      data: {
        ...(fullName !== undefined && { fullName }),
        ...(username !== undefined && { username }),
        ...(bio !== undefined && { bio }),
        ...(avatar !== undefined && { avatar }),
      },
      select: {
        id: true,
        username: true,
        fullName: true,
        bio: true,
        avatar: true,
      },
    });

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
}

