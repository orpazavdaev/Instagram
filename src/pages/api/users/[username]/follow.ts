import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const payload = getUserFromRequest(req);
    if (!payload) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { username } = req.query;

    // Find the user to follow
    const userToFollow = await prisma.user.findUnique({
      where: { username: username as string },
    });

    if (!userToFollow) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Can't follow yourself
    if (userToFollow.id === payload.userId) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: payload.userId,
          followingId: userToFollow.id,
        },
      },
    });

    if (existingFollow) {
      // Unfollow
      await prisma.follow.delete({
        where: { id: existingFollow.id },
      });
      return res.status(200).json({ following: false });
    } else {
      // Follow
      await prisma.follow.create({
        data: {
          followerId: payload.userId,
          followingId: userToFollow.id,
        },
      });
      return res.status(200).json({ following: true });
    }
  } catch (error) {
    console.error('Follow error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}


