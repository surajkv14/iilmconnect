'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Heart,
  Image as ImageIcon,
  MessageSquare,
  MoreHorizontal,
  Repeat2,
  Send,
  Video,
} from 'lucide-react';
import Image from 'next/image';

const currentUser = {
  name: 'Jane Doe',
  title: 'Computer Science Student',
  avatar: 'https://picsum.photos/seed/user-jane/80/80',
};

const initialPosts = [
  {
    id: 1,
    author: {
      name: 'Dr. Alan Turing',
      avatar: 'https://picsum.photos/seed/turing/40/40',
    },
    time: '2h ago',
    content: 'Just published a new paper on the applications of machine learning in computational biology. The potential for AI to accelerate scientific discovery is truly astounding. #AI #MachineLearning #Research',
    likes: 128,
    comments: 12,
    shares: 23,
    liked: false,
  },
  {
    id: 2,
    author: {
      name: 'IILM Placement Cell',
      avatar: 'https://picsum.photos/seed/iilm-cell/40/40',
    },
    time: '8h ago',
    content: 'Mega recruitment drive next week! A leading tech giant is visiting campus for multiple software engineering roles. Prepare your resumes and brush up on your data structures. #Jobs #Recruitment #IILM',
    image: 'https://picsum.photos/seed/campus-drive/600/400',
    imageHint: 'recruitment event',
    likes: 350,
    comments: 45,
    shares: 112,
    liked: true,
  },
];

const initialWhoToFollow = [
    { name: 'Dr. Tim Berners-Lee', title: 'Web Development Professor', avatar: 'https://picsum.photos/seed/berners-lee/40/40', isFollowing: false },
    { name: 'Alumni Association', title: 'Official Alumni Network', avatar: 'https://picsum.photos/seed/alumni/40/40', isFollowing: false },
];


export default function CollabNestPage() {
  const [posts, setPosts] = useState(initialPosts);
  const [newPostContent, setNewPostContent] = useState('');
  const [whoToFollow, setWhoToFollow] = useState(initialWhoToFollow);

  const handlePost = () => {
    if (!newPostContent.trim()) return;

    const newPost = {
        id: posts.length + 1,
        author: {
            name: currentUser.name,
            avatar: currentUser.avatar,
        },
        time: 'Just now',
        content: newPostContent,
        likes: 0,
        comments: 0,
        shares: 0,
        liked: false,
    };

    setPosts([newPost, ...posts]);
    setNewPostContent('');
  };

  const handleLike = (postId: number) => {
    setPosts(posts.map(post => 
        post.id === postId 
        ? { ...post, liked: !post.liked, likes: post.liked ? post.likes - 1 : post.likes + 1 } 
        : post
    ));
  };
  
  const handleFollow = (personName: string) => {
    setWhoToFollow(whoToFollow.map(person => 
        person.name === personName
        ? { ...person, isFollowing: !person.isFollowing }
        : person
    ));
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">CollabNest</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-6">
          {/* Create Post */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-4">
                <Avatar>
                  <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
                  <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="w-full">
                   <Textarea 
                      placeholder={`What's on your mind, ${currentUser.name.split(' ')[0]}?`} 
                      className="w-full bg-muted border-0 focus-visible:ring-1 ring-primary p-4" 
                      rows={2}
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                    />
                </div>
            </CardHeader>
            <CardFooter className="flex justify-between items-center">
                <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="text-muted-foreground">
                        <ImageIcon className="mr-2" /> Image
                    </Button>
                     <Button variant="ghost" size="sm" className="text-muted-foreground">
                        <Video className="mr-2" /> Video
                    </Button>
                </div>
                <Button onClick={handlePost} disabled={!newPostContent.trim()}>
                    <Send className="mr-2" /> Post
                </Button>
            </CardFooter>
          </Card>

          {/* Posts Feed */}
          {posts.map((post) => (
            <Card key={post.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarImage src={post.author.avatar} alt={post.author.name} />
                            <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold">{post.author.name}</p>
                            <p className="text-xs text-muted-foreground">{post.time}</p>
                        </div>
                    </div>
                     <Button variant="ghost" size="icon">
                        <MoreHorizontal />
                    </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4 whitespace-pre-wrap">{post.content}</p>
                {post.image && (
                    <div className="rounded-lg overflow-hidden border">
                        <Image 
                            src={post.image}
                            alt="Post image"
                            width={600}
                            height={400}
                            className="w-full object-cover"
                            data-ai-hint={post.imageHint}
                        />
                    </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between items-center border-t pt-4">
                <Button variant="ghost" size="sm" className={`flex items-center gap-2 ${post.liked ? 'text-destructive' : 'text-muted-foreground'} hover:text-destructive`} onClick={() => handleLike(post.id)}>
                    <Heart className="size-5" fill={post.liked ? 'hsl(var(--destructive))' : 'none'} /> <span>{post.likes}</span>
                </Button>
                 <Button variant="ghost" size="sm" className="flex items-center gap-2 text-muted-foreground">
                    <MessageSquare className="size-5" /> <span>{post.comments}</span>
                </Button>
                 <Button variant="ghost" size="sm" className="flex items-center gap-2 text-muted-foreground">
                    <Repeat2 className="size-5" /> <span>{post.shares}</span>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-xl">My Profile</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center text-center">
                    <Avatar className="size-20 mb-4">
                        <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
                        <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <p className="font-bold text-lg">{currentUser.name}</p>
                    <p className="text-sm text-muted-foreground">{currentUser.title}</p>
                    <Button variant="outline" className="mt-4 w-full">View Profile</Button>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle className="text-xl">Who to Follow</CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-4">
                        {whoToFollow.map((person) => (
                           <li key={person.name} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarImage src={person.avatar} alt={person.name} />
                                        <AvatarFallback>{person.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold text-sm">{person.name}</p>
                                        <p className="text-xs text-muted-foreground">{person.title}</p>
                                    </div>
                                </div>
                                <Button 
                                  variant={person.isFollowing ? 'default' : 'outline'} 
                                  size="sm"
                                  onClick={() => handleFollow(person.name)}
                                >
                                    {person.isFollowing ? 'Following' : 'Follow'}
                                </Button>
                           </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
