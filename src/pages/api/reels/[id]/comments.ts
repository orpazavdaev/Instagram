import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid reel ID' });
  }

  if (req.method === 'GET') {
    return getComments(req, res, id);
  } else if (req.method === 'POST') {
    return addComment(req, res, id);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

async function getComments(req: NextApiRequest, res: NextApiResponse, reelId: string) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const payload = token ? verifyToken(token) : null;
    const currentUserId = payload?.userId || '';

    const comments = await prisma.reelComment.findMany({
      where: { reelId },
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
          select: { likes: true },
        },
      },
    });

    const formattedComments = comments.map(comment => ({
      id: comment.id,
      text: comment.text,
      createdAt: comment.createdAt.toISOString(),
      user: comment.user,
      likesCount: comment._count.likes,
      isLiked: comment.likes.length > 0,
    }));

    return res.status(200).json(formattedComments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return res.status(500).json({ error: 'Failed to fetch comments' });
  }
}

async function addComment(req: NextApiRequest, res: NextApiResponse, reelId: string) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { text } = req.body;

    if (!text || text.trim() === '') {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    const comment = await prisma.reelComment.create({
      data: {
        text: text.trim(),
        userId: payload.userId,
        reelId,
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

    return res.status(201).json({
      id: comment.id,
      text: comment.text,
      createdAt: comment.createdAt.toISOString(),
      user: comment.user,
      likesCount: 0,
      isLiked: false,
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    return res.status(500).json({ error: 'Failed to add comment' });
  }
}


