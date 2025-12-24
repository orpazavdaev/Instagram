import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return getHighlights(req, res);
  } else if (req.method === 'POST') {
    return createHighlight(req, res);
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

async function getHighlights(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { userId } = req.query;
    
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const highlights = await prisma.highlight.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      include: {
        stories: {
          include: {
            story: {
              select: {
                id: true,
                image: true,
                createdAt: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    const formatted = highlights.map(h => ({
      id: h.id,
      name: h.name,
      image: h.image || (h.stories[0]?.story.image || null),
      storiesCount: h.stories.length,
      stories: h.stories.map(hs => hs.story),
    }));

    res.status(200).json(formatted);
  } catch (error) {
    console.error('Get highlights error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function createHighlight(req: NextApiRequest, res: NextApiResponse) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, storyIds } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    if (!storyIds || !Array.isArray(storyIds) || storyIds.length === 0) {
      return res.status(400).json({ error: 'At least one story is required' });
    }

    // Get first story for cover image
    const firstStory = await prisma.story.findUnique({
      where: { id: storyIds[0] },
      select: { image: true },
    });

    const highlight = await prisma.highlight.create({
      data: {
        name,
        image: firstStory?.image || null,
        userId: payload.userId,
        stories: {
          create: storyIds.map(storyId => ({
            storyId,
          })),
        },
      },
      include: {
        stories: {
          include: {
            story: true,
          },
        },
      },
    });

    res.status(201).json(highlight);
  } catch (error) {
    console.error('Create highlight error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}




