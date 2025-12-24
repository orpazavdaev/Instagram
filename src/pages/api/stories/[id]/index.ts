import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid story ID' });
  }

  if (req.method === 'GET') {
    return getStory(req, res, id);
  } else if (req.method === 'DELETE') {
    return deleteStory(req, res, id);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

async function getStory(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    const story = await prisma.story.findUnique({
      where: { id },
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

    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }

    return res.status(200).json(story);
  } catch (error) {
    console.error('Error fetching story:', error);
    return res.status(500).json({ error: 'Failed to fetch story' });
  }
}

async function deleteStory(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if story exists and belongs to user
    const story = await prisma.story.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!story) {
      return res.status(404).json({ error: 'Story not found' });
    }

    if (story.userId !== payload.userId) {
      return res.status(403).json({ error: 'You can only delete your own stories' });
    }

    // Delete the story (cascades to views, likes, and highlight connections)
    await prisma.story.delete({
      where: { id },
    });

    return res.status(200).json({ success: true, message: 'Story deleted successfully' });
  } catch (error) {
    console.error('Error deleting story:', error);
    return res.status(500).json({ error: 'Failed to delete story' });
  }
}



