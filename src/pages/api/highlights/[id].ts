import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Highlight ID is required' });
  }

  if (req.method === 'GET') {
    return getHighlight(id, res);
  } else if (req.method === 'PUT') {
    return updateHighlight(req, res, id);
  } else if (req.method === 'DELETE') {
    return deleteHighlight(req, res, id);
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}

async function getHighlight(id: string, res: NextApiResponse) {
  try {
    const highlight = await prisma.highlight.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
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

    if (!highlight) {
      return res.status(404).json({ error: 'Highlight not found' });
    }

    const formatted = {
      id: highlight.id,
      name: highlight.name,
      image: highlight.image || (highlight.stories[0]?.story.image || null),
      user: highlight.user,
      stories: highlight.stories.map(hs => ({
        id: hs.story.id,
        image: hs.story.image,
        createdAt: hs.story.createdAt,
      })),
    };

    res.status(200).json(formatted);
  } catch (error) {
    console.error('Get highlight error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function updateHighlight(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, storyIds } = req.body;

    // Check ownership
    const existing = await prisma.highlight.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Highlight not found' });
    }

    if (existing.userId !== payload.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Update name if provided
    if (name) {
      await prisma.highlight.update({
        where: { id },
        data: { name },
      });
    }

    // Update stories if provided
    if (storyIds && Array.isArray(storyIds)) {
      // Delete existing stories
      await prisma.highlightStory.deleteMany({
        where: { highlightId: id },
      });

      // Add new stories
      await prisma.highlightStory.createMany({
        data: storyIds.map(storyId => ({
          highlightId: id,
          storyId,
        })),
      });

      // Update cover image
      if (storyIds.length > 0) {
        const firstStory = await prisma.story.findUnique({
          where: { id: storyIds[0] },
          select: { image: true },
        });
        await prisma.highlight.update({
          where: { id },
          data: { image: firstStory?.image },
        });
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Update highlight error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function deleteHighlight(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check ownership
    const existing = await prisma.highlight.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Highlight not found' });
    }

    if (existing.userId !== payload.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await prisma.highlight.delete({
      where: { id },
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Delete highlight error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}


