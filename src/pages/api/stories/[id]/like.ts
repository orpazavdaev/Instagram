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

    const { id: storyId } = req.query;

    if (!storyId || typeof storyId !== 'string') {
      return res.status(400).json({ error: 'Story ID is required' });
    }

    // Check if story exists
    const story = await prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }

    // Check if already liked
    const existingLike = await prisma.storyLike.findUnique({
      where: {
        userId_storyId: {
          userId: payload.userId,
          storyId,
        },
      },
    });

    if (existingLike) {
      // Unlike
      await prisma.storyLike.delete({
        where: { id: existingLike.id },
      });
      return res.status(200).json({ liked: false });
    } else {
      // Like
      await prisma.storyLike.create({
        data: {
          userId: payload.userId,
          storyId,
        },
      });
      return res.status(200).json({ liked: true });
    }
  } catch (error) {
    console.error('Story like error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

