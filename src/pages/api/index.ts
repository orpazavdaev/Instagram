import type { NextApiRequest, NextApiResponse } from 'next';

type Data = {
  message: string;
  version: string;
  endpoints: string[];
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  res.status(200).json({
    message: 'Instagram API',
    version: '1.0.0',
    endpoints: [
      '/api/users',
      '/api/posts',
    ],
  });
}




