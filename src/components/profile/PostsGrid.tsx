import Image from 'next/image';
import Link from 'next/link';

interface Post {
  id: number;
  image: string;
}

interface PostsGridProps {
  posts: Post[];
}

export default function PostsGrid({ posts }: PostsGridProps) {
  return (
    <div className="posts-grid">
      {posts.map((post) => (
        <Link
          key={post.id}
          href={`/post/${post.id}`}
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




