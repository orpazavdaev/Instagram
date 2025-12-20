import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const payload = getUserFromRequest(req);
    if (!payload) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get ALL stories for this user (not just last 24 hours)
    // This is for highlight creation which can include old stories
    const stories = await prisma.story.findMany({
      where: { userId: payload.userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        image: true,
        createdAt: true,
      },
    });

    res.status(200).json(stories);
  } catch (error) {
    console.error('Get user stories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

