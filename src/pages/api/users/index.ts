import type { NextApiRequest, NextApiResponse } from 'next';

const users = [
  {
    id: 1,
    username: 'orpaz_avdaev',
    fullName: 'Orpaz Avdaev',
    avatar: 'https://i.pravatar.cc/150?img=33',
    bio: 'Digital creator',
    posts: 27,
    followers: 137,
    following: 154,
  },
];

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    res.status(200).json({ users });
  } else if (req.method === 'POST') {
    const body = req.body;
    res.status(201).json({
      message: 'User creation endpoint',
      received: body,
    });
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

