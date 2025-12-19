import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const postId = id as string;

  if (req.method === 'GET') {
    return getComments(postId, res);
  } else if (req.method === 'POST') {
    return createComment(req, postId, res);
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

async function getComments(postId: string, res: NextApiResponse) {
  try {
    const comments = await prisma.comment.findMany({
      where: { postId },
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

    // Add likesCount (will be populated after Prisma regenerate)
    const commentsWithLikes = comments.map(comment => ({
      ...comment,
      likesCount: 0, // TODO: Add likes count after prisma generate
    }));

    res.status(200).json(commentsWithLikes);
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function createComment(req: NextApiRequest, postId: string, res: NextApiResponse) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const comment = await prisma.comment.create({
      data: {
        text,
        userId: payload.userId,
        postId,
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

    res.status(201).json(comment);
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}



