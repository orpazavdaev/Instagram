import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create demo user (username: 1, password: 1)
  const hashedPassword = await bcrypt.hash('1', 10);
  
  const demoUser = await prisma.user.upsert({
    where: { username: '1' },
    update: {},
    create: {
      username: '1',
      password: hashedPassword,
      fullName: 'Demo User',
      bio: 'This is a demo account 👋\nWelcome to Instagram Clone!',
      avatar: 'https://i.pravatar.cc/150?img=33',
    },
  });

  console.log('✅ Created demo user:', demoUser.username);

  // Create some additional users
  const users = await Promise.all([
    prisma.user.upsert({
      where: { username: 'gal_gadot' },
      update: {},
      create: {
        username: 'gal_gadot',
        password: hashedPassword,
        fullName: 'Gal Gadot',
        bio: 'Actress | Wonder Woman ⭐',
        avatar: 'https://i.pravatar.cc/150?img=5',
      },
    }),
    prisma.user.upsert({
      where: { username: 'travel_adventures' },
      update: {},
      create: {
        username: 'travel_adventures',
        password: hashedPassword,
        fullName: 'Travel Adventures',
        bio: 'Exploring the world 🌍✈️',
        avatar: 'https://i.pravatar.cc/150?img=8',
      },
    }),
    prisma.user.upsert({
      where: { username: 'food_lover' },
      update: {},
      create: {
        username: 'food_lover',
        password: hashedPassword,
        fullName: 'Food Lover',
        bio: 'Food is life 🍕🍔🍜',
        avatar: 'https://i.pravatar.cc/150?img=15',
      },
    }),
  ]);

  console.log('✅ Created additional users');

  // Create posts for demo user
  const posts = await Promise.all([
    prisma.post.create({
      data: {
        userId: demoUser.id,
        image: 'https://picsum.photos/seed/nature1/600/600',
        caption: 'Nature ✨🌿',
      },
    }),
    prisma.post.create({
      data: {
        userId: users[1].id,
        image: 'https://picsum.photos/seed/beach1/600/600',
        caption: 'Paradise found 🏝️',
      },
    }),
    prisma.post.create({
      data: {
        userId: users[2].id,
        image: 'https://picsum.photos/seed/food1/600/600',
        caption: 'Delicious 😋🍕',
      },
    }),
  ]);

  console.log('✅ Created posts');

  // Create stories
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  
  await Promise.all([
    prisma.story.create({
      data: {
        userId: users[0].id,
        image: 'https://picsum.photos/seed/story1/720/1280',
        expiresAt,
      },
    }),
    prisma.story.create({
      data: {
        userId: users[1].id,
        image: 'https://picsum.photos/seed/story2/720/1280',
        expiresAt,
      },
    }),
    prisma.story.create({
      data: {
        userId: users[2].id,
        image: 'https://picsum.photos/seed/story3/720/1280',
        expiresAt,
      },
    }),
  ]);

  console.log('✅ Created stories');

  // Create some follows (skip if already exist)
  try {
    await Promise.all([
      prisma.follow.upsert({
        where: { followerId_followingId: { followerId: demoUser.id, followingId: users[0].id } },
        update: {},
        create: { followerId: demoUser.id, followingId: users[0].id },
      }),
      prisma.follow.upsert({
        where: { followerId_followingId: { followerId: demoUser.id, followingId: users[1].id } },
        update: {},
        create: { followerId: demoUser.id, followingId: users[1].id },
      }),
      prisma.follow.upsert({
        where: { followerId_followingId: { followerId: users[0].id, followingId: demoUser.id } },
        update: {},
        create: { followerId: users[0].id, followingId: demoUser.id },
      }),
    ]);
    console.log('✅ Created follows');
  } catch (e) {
    console.log('⏭️ Follows already exist, skipping...');
  }

  // Create some comments
  await Promise.all([
    prisma.comment.create({
      data: {
        userId: users[0].id,
        postId: posts[0].id,
        text: 'Beautiful! 😍',
      },
    }),
    prisma.comment.create({
      data: {
        userId: users[1].id,
        postId: posts[0].id,
        text: 'Amazing view!',
      },
    }),
  ]);

  console.log('✅ Created comments');

  // Create some likes
  await Promise.all([
    prisma.like.create({
      data: {
        userId: users[0].id,
        postId: posts[0].id,
      },
    }),
    prisma.like.create({
      data: {
        userId: users[1].id,
        postId: posts[0].id,
      },
    }),
    prisma.like.create({
      data: {
        userId: users[2].id,
        postId: posts[0].id,
      },
    }),
  ]);

  console.log('✅ Created likes');

  // Create messages
  await Promise.all([
    prisma.message.create({
      data: {
        senderId: users[0].id,
        receiverId: demoUser.id,
        text: 'Hey! How are you? 😊',
      },
    }),
    prisma.message.create({
      data: {
        senderId: users[1].id,
        receiverId: demoUser.id,
        text: 'Check out my new photos!',
      },
    }),
  ]);

  console.log('✅ Created messages');

  // Create more stories for demo user (for highlights)
  const demoStories = await Promise.all([
    prisma.story.create({
      data: {
        userId: demoUser.id,
        image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=720&h=1280&fit=crop',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days for highlights
      },
    }),
    prisma.story.create({
      data: {
        userId: demoUser.id,
        image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=720&h=1280&fit=crop',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.story.create({
      data: {
        userId: demoUser.id,
        image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=720&h=1280&fit=crop',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.story.create({
      data: {
        userId: demoUser.id,
        image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=720&h=1280&fit=crop',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.story.create({
      data: {
        userId: demoUser.id,
        image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=720&h=1280&fit=crop',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.story.create({
      data: {
        userId: demoUser.id,
        image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=720&h=1280&fit=crop',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    }),
  ]);

  console.log('✅ Created demo user stories for highlights');

  // Delete old highlights and create new ones with stories
  await prisma.highlightStory.deleteMany({});
  await prisma.highlight.deleteMany({ where: { userId: demoUser.id } });
  
  const highlights = await Promise.all([
    prisma.highlight.create({
      data: {
        userId: demoUser.id,
        name: 'Travel',
        image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=150&h=150&fit=crop',
        stories: {
          create: [
            { storyId: demoStories[0].id },
            { storyId: demoStories[1].id },
          ],
        },
      },
    }),
    prisma.highlight.create({
      data: {
        userId: demoUser.id,
        name: 'Food',
        image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=150&h=150&fit=crop',
        stories: {
          create: [
            { storyId: demoStories[2].id },
          ],
        },
      },
    }),
    prisma.highlight.create({
      data: {
        userId: demoUser.id,
        name: 'Fitness',
        image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=150&h=150&fit=crop',
        stories: {
          create: [
            { storyId: demoStories[3].id },
          ],
        },
      },
    }),
    prisma.highlight.create({
      data: {
        userId: demoUser.id,
        name: 'Music',
        image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150&h=150&fit=crop',
        stories: {
          create: [
            { storyId: demoStories[4].id },
          ],
        },
      },
    }),
    prisma.highlight.create({
      data: {
        userId: demoUser.id,
        name: 'Friends',
        image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=150&h=150&fit=crop',
        stories: {
          create: [
            { storyId: demoStories[5].id },
          ],
        },
      },
    }),
  ]);

  console.log('✅ Created highlights with stories');

  // Create sample reels
  const reels = await Promise.all([
    prisma.reel.create({
      data: {
        userId: demoUser.id,
        video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        thumbnail: 'https://picsum.photos/seed/reel1/300/533',
        caption: 'Amazing fire show 🔥',
      },
    }),
    prisma.reel.create({
      data: {
        userId: users[0].id,
        video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        thumbnail: 'https://picsum.photos/seed/reel2/300/533',
        caption: 'Adventure awaits! 🏔️',
      },
    }),
    prisma.reel.create({
      data: {
        userId: users[1].id,
        video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
        thumbnail: 'https://picsum.photos/seed/reel3/300/533',
        caption: 'Fun times! 🎉',
      },
    }),
    prisma.reel.create({
      data: {
        userId: users[2].id,
        video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
        thumbnail: 'https://picsum.photos/seed/reel4/300/533',
        caption: 'Road trip vibes 🚗',
      },
    }),
    prisma.reel.create({
      data: {
        userId: demoUser.id,
        video: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        thumbnail: 'https://picsum.photos/seed/reel5/300/533',
        caption: 'Big Buck Bunny 🐰',
      },
    }),
  ]);

  console.log('✅ Created reels');

  // Add some likes and comments to reels
  await Promise.all([
    prisma.reelLike.create({
      data: { userId: users[0].id, reelId: reels[0].id },
    }),
    prisma.reelLike.create({
      data: { userId: users[1].id, reelId: reels[0].id },
    }),
    prisma.reelLike.create({
      data: { userId: users[2].id, reelId: reels[0].id },
    }),
    prisma.reelComment.create({
      data: {
        userId: users[0].id,
        reelId: reels[0].id,
        text: 'This is so cool! 🔥',
      },
    }),
    prisma.reelComment.create({
      data: {
        userId: users[1].id,
        reelId: reels[0].id,
        text: 'Awesome! 😍',
      },
    }),
  ]);

  console.log('✅ Created reel likes and comments');

  console.log('🎉 Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


