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

    const savedPosts = await prisma.savedPost.findMany({
      where: { userId: payload.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        post: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
              },
            },
            _count: {
              select: {
                likes: true,
                comments: true,
              },
            },
          },
        },
      },
    });

    const posts = savedPosts.map(sp => ({
      id: sp.post.id,
      image: sp.post.image,
      caption: sp.post.caption,
      createdAt: sp.post.createdAt,
      user: sp.post.user,
      likesCount: sp.post._count.likes,
      commentsCount: sp.post._count.comments,
      savedAt: sp.createdAt,
    }));

    return res.status(200).json(posts);
  } catch (error) {
    console.error('Get saved posts error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

