import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return getStories(res);
  } else if (req.method === 'POST') {
    return createStory(req, res);
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

async function getStories(res: NextApiResponse) {
  try {
    // Get stories from last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const stories = await prisma.story.findMany({
      where: {
        createdAt: {
          gte: oneDayAgo,
        },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    // Group stories by user
    const groupedStories = stories.reduce((acc, story) => {
      const userId = story.user.id;
      if (!acc[userId]) {
        acc[userId] = {
          user: story.user,
          stories: [],
        };
      }
      acc[userId].stories.push(story);
      return acc;
    }, {} as Record<string, { user: typeof stories[0]['user']; stories: typeof stories }>);

    res.status(200).json(Object.values(groupedStories));
  } catch (error) {
    console.error('Get stories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function createStory(req: NextApiRequest, res: NextApiResponse) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { image, music } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Image is required' });
    }

    const story = await prisma.story.create({
      data: {
        image,
        music,
        userId: payload.userId,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    res.status(201).json(story);
  } catch (error) {
    console.error('Create story error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}



