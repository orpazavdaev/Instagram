import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { verifyToken, getUserFromRequest } from '@/lib/auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid reel ID' });
  }

  if (req.method === 'GET') {
    return getReel(req, res, id);
  } else if (req.method === 'DELETE') {
    return deleteReel(req, res, id);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

async function getReel(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const payload = token ? verifyToken(token) : null;
    const currentUserId = payload?.userId || '';

    const reel = await prisma.reel.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        likes: {
          where: { userId: currentUserId },
          select: { userId: true },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    if (!reel) {
      return res.status(404).json({ error: 'Reel not found' });
    }

    return res.status(200).json({
      id: reel.id,
      video: reel.video,
      thumbnail: reel.thumbnail,
      caption: reel.caption,
      createdAt: reel.createdAt.toISOString(),
      user: reel.user,
      likesCount: reel._count.likes,
      commentsCount: reel._count.comments,
      isLiked: reel.likes.length > 0,
    });
  } catch (error) {
    console.error('Error fetching reel:', error);
    return res.status(500).json({ error: 'Failed to fetch reel' });
  }
}

async function deleteReel(req: NextApiRequest, res: NextApiResponse, id: string) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Check if reel exists and belongs to user
    const reel = await prisma.reel.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!reel) {
      return res.status(404).json({ error: 'Reel not found' });
    }

    if (reel.userId !== payload.userId) {
      return res.status(403).json({ error: 'You can only delete your own reels' });
    }

    // Delete the reel (cascades to likes and comments)
    await prisma.reel.delete({
      where: { id },
    });

    return res.status(200).json({ success: true, message: 'Reel deleted successfully' });
  } catch (error) {
    console.error('Error deleting reel:', error);
    return res.status(500).json({ error: 'Failed to delete reel' });
  }
}
