import type { NextApiRequest, NextApiResponse } from 'next';

const posts = [
  {
    id: 1,
    userId: 1,
    image: 'https://picsum.photos/seed/post1/600/600',
    caption: 'Beautiful day!',
    likes: 124,
    comments: 12,
    createdAt: new Date().toISOString(),
  },
];

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    res.status(200).json({ posts });
  } else if (req.method === 'POST') {
    const body = req.body;
    res.status(201).json({
      message: 'Post creation endpoint',
      received: body,
    });
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

