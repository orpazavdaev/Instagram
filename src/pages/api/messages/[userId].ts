import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import { getUserFromRequest } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const payload = getUserFromRequest(req);
  if (!payload) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { userId } = req.query;
  const partnerId = userId as string;

  if (req.method === 'GET') {
    return getMessages(payload.userId, partnerId, res);
  } else if (req.method === 'POST') {
    return sendMessage(req, payload.userId, partnerId, res);
  }
  return res.status(405).json({ error: 'Method not allowed' });
}

async function getMessages(userId: string, partnerId: string, res: NextApiResponse) {
  try {
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: partnerId },
          { senderId: partnerId, receiverId: userId },
        ],
      },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    // Mark as read
    await prisma.message.updateMany({
      where: {
        senderId: partnerId,
        receiverId: userId,
        read: false,
      },
      data: { read: true },
    });

    res.status(200).json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function sendMessage(
  req: NextApiRequest,
  userId: string,
  partnerId: string,
  res: NextApiResponse
) {
  try {
    const { text, type = 'text' } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const message = await prisma.message.create({
      data: {
        text,
        type,
        senderId: userId,
        receiverId: partnerId,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    res.status(201).json(message);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}



