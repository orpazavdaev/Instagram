import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid reel ID' });
  }

  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Check if already liked
    const existingLike = await prisma.reelLike.findUnique({
      where: {
        userId_reelId: {
          userId: payload.userId,
          reelId: id,
        },
      },
    });

    if (existingLike) {
      // Unlike
      await prisma.reelLike.delete({
        where: { id: existingLike.id },
      });
      return res.status(200).json({ liked: false });
    } else {
      // Like
      await prisma.reelLike.create({
        data: {
          userId: payload.userId,
          reelId: id,
        },
      });
      return res.status(200).json({ liked: true });
    }
  } catch (error) {
    console.error('Error toggling reel like:', error);
    return res.status(500).json({ error: 'Failed to toggle like' });
  }
}


