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
      // If not logged in, just return success without tracking
      return res.status(200).json({ viewed: false });
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

    // Track views on all stories (including own stories for border color)
    // Create or update view
    await prisma.storyView.upsert({
      where: {
        userId_storyId: {
          userId: payload.userId,
          storyId,
        },
      },
      update: {
        viewedAt: new Date(),
      },
      create: {
        userId: payload.userId,
        storyId,
      },
    });

    res.status(200).json({ viewed: true });
  } catch (error) {
    console.error('View story error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

