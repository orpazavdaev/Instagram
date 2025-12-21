import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const payload = getUserFromRequest(req);
    if (!payload) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id: postId } = req.query;

    if (typeof postId !== 'string') {
      return res.status(400).json({ error: 'Invalid post ID' });
    }

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check if already saved
    const existingSave = await prisma.savedPost.findUnique({
      where: {
        userId_postId: {
          userId: payload.userId,
          postId,
        },
      },
    });

    if (existingSave) {
      // Unsave
      await prisma.savedPost.delete({
        where: { id: existingSave.id },
      });
      return res.status(200).json({ saved: false });
    } else {
      // Save
      await prisma.savedPost.create({
        data: {
          userId: payload.userId,
          postId,
        },
      });
      return res.status(200).json({ saved: true });
    }
  } catch (error) {
    console.error('Save post error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

