import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';
import { withLogging } from '@/lib/apiHandler';
import logger from '@/lib/logger';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return getPosts(req, res);
  } else if (req.method === 'POST') {
    return createPost(req, res);
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

export default withLogging(handler);

async function getPosts(req: NextApiRequest, res: NextApiResponse) {
  try {
    const payload = getUserFromRequest(req);
    const currentUserId = payload?.userId;

    // Get IDs of users the current user follows (plus own posts)
    let followedUserIds: string[] = [];
    if (currentUserId) {
      const follows = await prisma.follow.findMany({
        where: { followerId: currentUserId },
        select: { followingId: true },
      });
      followedUserIds = follows.map(f => f.followingId);
      // Include own posts
      followedUserIds.push(currentUserId);
    }

    const posts = await prisma.post.findMany({
      where: currentUserId && followedUserIds.length > 0 ? {
        userId: { in: followedUserIds },
      } : {},
      orderBy: { createdAt: 'desc' },
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
        likes: {
          select: {
            userId: true,
          },
        },
      },
    });

    const postsWithCounts = posts.map((post) => ({
      id: post.id,
      image: post.image,
      caption: post.caption,
      createdAt: post.createdAt,
      user: post.user,
      likesCount: post._count.likes,
      commentsCount: post._count.comments,
      likedByUser: post.likes.map((like) => like.userId),
    }));

    logger.info('Posts fetched', { metadata: { count: postsWithCounts.length } });
    res.status(200).json(postsWithCounts);
  } catch (error) {
    logger.error('Get posts error', { error: error instanceof Error ? error.message : 'Unknown error' });
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function createPost(req: NextApiRequest, res: NextApiResponse) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { image, caption } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Image is required' });
    }

    const post = await prisma.post.create({
      data: {
        image,
        caption,
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

    res.status(201).json(post);
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
