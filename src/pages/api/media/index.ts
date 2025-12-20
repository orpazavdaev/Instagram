import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

// API to get all images from posts, stories, and reels in the database
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get images from posts
    const posts = await prisma.post.findMany({
      select: {
        id: true,
        image: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // Get images from stories
    const stories = await prisma.story.findMany({
      select: {
        id: true,
        image: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // Get thumbnails from reels
    const reels = await prisma.reel.findMany({
      select: {
        id: true,
        thumbnail: true,
        video: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // Combine all unique images
    const allMedia: { id: string; url: string; type: 'post' | 'story' | 'reel' }[] = [];
    const seenUrls = new Set<string>();

    posts.forEach(post => {
      if (!seenUrls.has(post.image)) {
        seenUrls.add(post.image);
        allMedia.push({ id: post.id, url: post.image, type: 'post' });
      }
    });

    stories.forEach(story => {
      if (!seenUrls.has(story.image)) {
        seenUrls.add(story.image);
        allMedia.push({ id: story.id, url: story.image, type: 'story' });
      }
    });

    reels.forEach(reel => {
      if (reel.thumbnail && !seenUrls.has(reel.thumbnail)) {
        seenUrls.add(reel.thumbnail);
        allMedia.push({ id: reel.id, url: reel.thumbnail, type: 'reel' });
      }
    });

    return res.status(200).json(allMedia);
  } catch (error) {
    console.error('Error fetching media:', error);
    return res.status(500).json({ error: 'Failed to fetch media' });
  }
}


