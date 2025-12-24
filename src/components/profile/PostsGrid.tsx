import Image from 'next/image';
import Link from 'next/link';

interface Post {
  id: string;
  image: string;
}

interface PostsGridProps {
  posts: Post[];
  username?: string;
}

export default function PostsGrid({ posts, username }: PostsGridProps) {
  return (
    <div className="posts-grid">
      {posts.map((post) => (
        <Link
          key={post.id}
          href={username ? `/post/${post.id}?username=${username}` : `/post/${post.id}`}
          className="relative aspect-square"
        >
          <Image
            src={post.image}
            alt={`Post ${post.id}`}
            fill
            className="object-cover"
          />
        </Link>
      ))}
    </div>
  );
}




