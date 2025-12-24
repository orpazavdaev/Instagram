import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

interface Activity {
  id: string;
  type: 'post_like' | 'reel_like' | 'story_like' | 'new_follower' | 'comment';
  createdAt: string;
  user: {
    id: string;
    username: string;
    avatar: string | null;
  };
  content?: {
    id: string;
    image?: string;
    thumbnail?: string;
    text?: string;
  };
  isFollowingBack?: boolean;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const payload = getUserFromRequest(req);
  if (!payload) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const activities: Activity[] = [];

    // Get likes on my posts
    const postLikes = await prisma.like.findMany({
      where: {
        post: { userId: payload.userId },
        userId: { not: payload.userId }, // Exclude self-likes
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: {
          select: { id: true, username: true, avatar: true },
        },
        post: {
          select: { id: true, image: true },
        },
      },
    });

    postLikes.forEach(like => {
      activities.push({
        id: `post_like_${like.id}`,
        type: 'post_like',
        createdAt: like.createdAt.toISOString(),
        user: like.user,
        content: { id: like.post.id, image: like.post.image },
      });
    });

    // Get likes on my reels
    const reelLikes = await prisma.reelLike.findMany({
      where: {
        reel: { userId: payload.userId },
        userId: { not: payload.userId },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: {
          select: { id: true, username: true, avatar: true },
        },
        reel: {
          select: { id: true, thumbnail: true },
        },
      },
    });

    reelLikes.forEach(like => {
      activities.push({
        id: `reel_like_${like.id}`,
        type: 'reel_like',
        createdAt: like.createdAt.toISOString(),
        user: like.user,
        content: { id: like.reel.id, thumbnail: like.reel.thumbnail || undefined },
      });
    });

    // Get likes on my stories
    const storyLikes = await prisma.storyLike.findMany({
      where: {
        story: { userId: payload.userId },
        userId: { not: payload.userId },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: {
          select: { id: true, username: true, avatar: true },
        },
        story: {
          select: { id: true, image: true },
        },
      },
    });

    storyLikes.forEach(like => {
      activities.push({
        id: `story_like_${like.id}`,
        type: 'story_like',
        createdAt: like.createdAt.toISOString(),
        user: like.user,
        content: { id: like.story.id, image: like.story.image },
      });
    });

    // Get new followers
    const newFollowers = await prisma.follow.findMany({
      where: {
        followingId: payload.userId,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        follower: {
          select: { id: true, username: true, avatar: true },
        },
      },
    });

    // Check which followers the current user is following back
    const followerIds = newFollowers.map(f => f.follower.id);
    const followingBack = await prisma.follow.findMany({
      where: {
        followerId: payload.userId,
        followingId: { in: followerIds },
      },
      select: { followingId: true },
    });
    const followingBackSet = new Set(followingBack.map(f => f.followingId));

    newFollowers.forEach(follow => {
      activities.push({
        id: `follow_${follow.id}`,
        type: 'new_follower',
        createdAt: follow.createdAt.toISOString(),
        user: follow.follower,
        isFollowingBack: followingBackSet.has(follow.follower.id),
      });
    });

    // Get comments on my posts
    const comments = await prisma.comment.findMany({
      where: {
        post: { userId: payload.userId },
        userId: { not: payload.userId },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: {
          select: { id: true, username: true, avatar: true },
        },
        post: {
          select: { id: true, image: true },
        },
      },
    });

    comments.forEach(comment => {
      activities.push({
        id: `comment_${comment.id}`,
        type: 'comment',
        createdAt: comment.createdAt.toISOString(),
        user: comment.user,
        content: { id: comment.post.id, image: comment.post.image, text: comment.text },
      });
    });

    // Sort all activities by date
    activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Return top 100 activities
    res.status(200).json(activities.slice(0, 100));
  } catch (error) {
    console.error('Error fetching activity:', error);
    res.status(500).json({ error: 'Failed to fetch activity' });
  }
}

