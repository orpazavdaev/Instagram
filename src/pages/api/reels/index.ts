import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    return getReels(req, res);
  } else if (req.method === 'POST') {
    return createReel(req, res);
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}

async function getReels(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Get current user if logged in
    const token = req.headers.authorization?.replace('Bearer ', '');
    const payload = token ? verifyToken(token) : null;
    const currentUserId = payload?.userId || '';

    const reels = await prisma.reel.findMany({
      orderBy: { createdAt: 'desc' },
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

    const formattedReels = reels.map(reel => ({
      id: reel.id,
      video: reel.video,
      thumbnail: reel.thumbnail,
      caption: reel.caption,
      createdAt: reel.createdAt.toISOString(),
      user: reel.user,
      likesCount: reel._count.likes,
      commentsCount: reel._count.comments,
      isLiked: reel.likes.length > 0,
    }));

    return res.status(200).json(formattedReels);
  } catch (error) {
    console.error('Error fetching reels:', error);
    return res.status(500).json({ error: 'Failed to fetch reels' });
  }
}

async function createReel(req: NextApiRequest, res: NextApiResponse) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { video, thumbnail, caption } = req.body;

    if (!video) {
      return res.status(400).json({ error: 'Video URL is required' });
    }

    const reel = await prisma.reel.create({
      data: {
        video,
        thumbnail: thumbnail || null,
        caption: caption || null,
        userId: payload.userId,
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

    return res.status(201).json(reel);
  } catch (error) {
    console.error('Error creating reel:', error);
    return res.status(500).json({ error: 'Failed to create reel' });
  }
}


