'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Heart, Image as ImageIcon, MessageSquare, MoreHorizontal, Repeat2, Send, Video } from 'lucide-react';
import Image from 'next/image';
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, serverTimestamp, doc, Timestamp } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { formatDistanceToNowStrict } from 'date-fns';

// This represents the structure of a post document in Firestore
interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  timestamp: Timestamp | null;
  likedBy: string[];
  image?: string;
  imageHint?: string;
}

interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  timestamp: Timestamp | null;
}

const initialWhoToFollow = [
  { name: 'Dr. Tim Berners-Lee', title: 'Web Development Professor', avatar: 'https://picsum.photos/seed/berners-lee/40/40', isFollowing: false },
  { name: 'Alumni Association', title: 'Official Alumni Network', avatar: 'https://picsum.photos/seed/alumni/40/40', isFollowing: false },
];

export default function CollabNestPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  
  const [newPostContent, setNewPostContent] = useState('');
  const [whoToFollow, setWhoToFollow] = useState(initialWhoToFollow);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  
  // Memoize the Firestore query to prevent re-running on every render.
  // Only query for posts if the user is logged in, to comply with security rules.
  const postsQuery = useMemoFirebase(() => 
    (firestore && user) ? query(collection(firestore, 'posts'), orderBy('timestamp', 'desc')) : null
  , [firestore, user]);

  const { data: posts, isLoading: isLoadingPosts } = useCollection<Post>(postsQuery);

  const handlePost = () => {
    if (!newPostContent.trim() || !user || !firestore) return;

    const newPost = {
      authorId: user.uid,
      authorName: user.displayName || user.email || 'Anonymous',
      authorAvatar: user.photoURL || `https://picsum.photos/seed/${user.uid}/40/40`,
      content: newPostContent,
      timestamp: serverTimestamp(),
      likedBy: [],
    };

    addDocumentNonBlocking(collection(firestore, 'posts'), newPost);
    setNewPostContent('');
  };

  const handleLike = (post: Post) => {
    if (!user || !firestore) return;

    const postRef = doc(firestore, 'posts', post.id);
    const currentLikedBy = post.likedBy || [];
    let newLikedBy;

    if (currentLikedBy.includes(user.uid)) {
      // User has liked, so unlike
      newLikedBy = currentLikedBy.filter(uid => uid !== user.uid);
    } else {
      // User has not liked, so like
      newLikedBy = [...currentLikedBy, user.uid];
    }
    
    updateDocumentNonBlocking(postRef, { likedBy: newLikedBy });
  };
  
  const handleFollow = (personName: string) => {
    setWhoToFollow(whoToFollow.map(person => 
        person.name === personName
        ? { ...person, isFollowing: !person.isFollowing }
        : person
    ));
  };

  // Component for displaying and adding comments
  const CommentSection = ({ postId }: { postId: string }) => {
    const firestore = useFirestore();
    const { user } = useUser();
    const [newComment, setNewComment] = useState('');

    const commentsQuery = useMemoFirebase(
      () => (firestore && user) ? query(collection(firestore, 'posts', postId, 'comments'), orderBy('timestamp', 'asc')) : null,
      [firestore, postId, user]
    );
    const { data: comments, isLoading: isLoadingComments } = useCollection<Comment>(commentsQuery);

    const handleAddComment = () => {
      if (!newComment.trim() || !user || !firestore) return;

      const commentData = {
        postId: postId,
        authorId: user.uid,
        authorName: user.displayName || user.email || 'Anonymous',
        authorAvatar: user.photoURL || `https://picsum.photos/seed/${user.uid}/40/40`,
        content: newComment,
        timestamp: serverTimestamp(),
      };

      addDocumentNonBlocking(collection(firestore, 'posts', postId, 'comments'), commentData);
      setNewComment('');
    };

    return (
      <div className="pt-4 mt-4 border-t">
        {/* Add comment form */}
        {user && (
          <div className="flex items-start gap-4 mb-6">
            <Avatar className="size-9">
              <AvatarImage src={user.photoURL || `https://picsum.photos/seed/${user?.uid}/40/40`} alt={user.displayName || 'user'} />
              <AvatarFallback>{user.email?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="w-full flex items-center gap-2">
              <Textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="w-full bg-muted border-0 focus-visible:ring-1 ring-primary p-2"
                rows={1}
              />
              <Button onClick={handleAddComment} disabled={!newComment.trim()} size="icon">
                <Send className="size-4" />
              </Button>
            </div>
          </div>
        )}

        {/* List of comments */}
        <div className="space-y-4">
          {isLoadingComments && <Skeleton className="h-16 w-full" />}
          {comments && comments.length > 0 ? (
            comments.map((comment) => (
              <div key={comment.id} className="flex items-start gap-3">
                <Avatar className="size-9">
                  <AvatarImage src={comment.authorAvatar} alt={comment.authorName} />
                  <AvatarFallback>{comment.authorName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="bg-muted rounded-lg px-4 py-2">
                    <p className="font-semibold text-sm">{comment.authorName}</p>
                    <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {comment.timestamp ? formatDistanceToNowStrict(comment.timestamp.toDate(), { addSuffix: true }) : 'Just now'}
                  </p>
                </div>
              </div>
            ))
          ) : (
            !isLoadingComments && (
              <p className="text-sm text-muted-foreground text-center">
                {user ? 'No comments yet.' : 'Please log in to see comments.'}
              </p>
            )
          )}
        </div>
      </div>
    );
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
              {isUserLoading ? <Skeleton className="size-10 rounded-full" /> : (
                <Avatar>
                  <AvatarImage src={user?.photoURL || `https://picsum.photos/seed/${user?.uid}/40/40`} alt={user?.displayName || 'user'} />
                  <AvatarFallback>{user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
              )}
                <div className="w-full">
                  {!user && !isUserLoading ? (
                     <div className="text-center p-4 bg-muted rounded-md">
                        <p className="text-muted-foreground">
                            Please <Link href="/login" className="text-primary underline">log in</Link> to create a post.
                        </p>
                    </div>
                  ) : (
                    <Textarea 
                      placeholder={user ? `What's on your mind, ${user.displayName?.split(' ')[0] || user.email}?` : `What's on your mind?`}
                      className="w-full bg-muted border-0 focus-visible:ring-1 ring-primary p-4" 
                      rows={2}
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      disabled={!user || isUserLoading}
                    />
                  )}
                </div>
            </CardHeader>
             {user && (
                <CardFooter className="flex justify-between items-center">
                    <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="text-muted-foreground">
                            <ImageIcon className="mr-2" /> Image
                        </Button>
                        <Button variant="ghost" size="sm" className="text-muted-foreground">
                            <Video className="mr-2" /> Video
                        </Button>
                    </div>
                    <Button onClick={handlePost} disabled={!newPostContent.trim() || !user}>
                        <Send className="mr-2" /> Post
                    </Button>
                </CardFooter>
            )}
          </Card>

          {/* Posts Feed */}
          {(isLoadingPosts || isUserLoading) && (
             <div className="space-y-6">
                <Card><CardHeader><Skeleton className="h-24" /></CardHeader></Card>
                <Card><CardHeader><Skeleton className="h-32" /></CardHeader></Card>
             </div>
          )}
          {!isLoadingPosts && posts && posts.length > 0 && posts.map((post) => {
            const isLiked = user ? post.likedBy?.includes(user.uid) : false;
            return (
              <Card key={post.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                          <Avatar>
                              <AvatarImage src={post.authorAvatar} alt={post.authorName} />
                              <AvatarFallback>{post.authorName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                              <p className="font-semibold">{post.authorName}</p>
                              <p className="text-xs text-muted-foreground">
                                {post.timestamp ? formatDistanceToNowStrict(post.timestamp.toDate(), { addSuffix: true }) : 'Just now'}
                              </p>
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
                  <Button variant="ghost" size="sm" className={`flex items-center gap-2 ${isLiked ? 'text-destructive' : 'text-muted-foreground'} hover:text-destructive`} onClick={() => handleLike(post)} disabled={!user}>
                      <Heart className="size-5" fill={isLiked ? 'hsl(var(--destructive))' : 'none'} /> <span>{post.likedBy?.length || 0}</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2 text-muted-foreground" onClick={() => setExpandedPostId(expandedPostId === post.id ? null : post.id)}>
                      <MessageSquare className="size-5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2 text-muted-foreground">
                      <Repeat2 className="size-5" /> <span>0</span>
                  </Button>
                </CardFooter>
                 {expandedPostId === post.id && (
                    <CardContent className="pb-4">
                        <CommentSection postId={post.id} />
                    </CardContent>
                )}
              </Card>
            )
          })}
           {!isLoadingPosts && !isUserLoading && (!posts || posts.length === 0) && (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  {user ? (
                    <p>No posts yet. Be the first to share something!</p>
                  ) : (
                    <p>Please <Link href="/login" className="text-primary underline">log in</Link> to see the feed.</p>
                  )}
                </CardContent>
              </Card>
           )}
        </div>

        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-xl">My Profile</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center text-center">
                  {isUserLoading ? (
                    <div className="flex flex-col items-center text-center space-y-2">
                       <Skeleton className="size-20 rounded-full mb-2" />
                       <Skeleton className="h-6 w-32" />
                       <Skeleton className="h-4 w-48" />
                    </div>
                  ) : user ? (
                    <>
                      <Avatar className="size-20 mb-4">
                          <AvatarImage src={user.photoURL || `https://picsum.photos/seed/${user.uid}/80/80`} alt={user.displayName || 'user'} />
                          <AvatarFallback>{user.email?.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <p className="font-bold text-lg">{user.displayName || user.email}</p>
                      <p className="text-sm text-muted-foreground">Computer Science Student</p>
                      <Button variant="outline" className="mt-4 w-full">View Profile</Button>
                    </>
                  ) : (
                    <div className="text-center p-4">
                        <p className="text-muted-foreground">
                            <Link href="/login" className="text-primary underline">Log in</Link> to see your profile.
                        </p>
                    </div>
                  )}
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
