import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid post ID' });
  }

  try {
    const payload = getUserFromRequest(req);
    const currentUserId = payload?.userId || '';

    const post = await prisma.post.findUnique({
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

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    return res.status(200).json({
      id: post.id,
      image: post.image,
      caption: post.caption,
      createdAt: post.createdAt.toISOString(),
      user: post.user,
      likesCount: post._count.likes,
      commentsCount: post._count.comments,
      isLiked: post.likes.length > 0,
    });
  } catch (error) {
    console.error('Error fetching post:', error);
    return res.status(500).json({ error: 'Failed to fetch post' });
  }
}

