'use client';

import {
  LayoutDashboard,
  Utensils,
  LogOut,
  LogIn,
  User as UserIcon,
  ChevronDown,
  Settings,
  History,
  AlertTriangle,
  ShieldCheck
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '../ui/button';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { signOut } from 'firebase/auth';
import { Skeleton } from '../ui/skeleton';
import { doc } from 'firebase/firestore';

export function AppSidebar() {
  const { state } = useSidebar();
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const auth = useAuth();
  const router = useRouter();

  const userProfileRef = useMemoFirebase(() => (user ? doc(firestore, 'users', user.uid) : null), [user, firestore]);
  const { data: userProfile } = useDoc(userProfileRef);

  const isAdmin = userProfile?.userType === 'admin';

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 p-2">
          <Utensils className="size-8 text-primary" />
          <span
            className="text-xl font-semibold text-primary"
            style={{ opacity: state === 'expanded' ? 1 : 0, transition: 'opacity 0.2s' }}
          >
            Smart Mess
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === '/'} tooltip="Dashboard">
              <Link href="/">
                <LayoutDashboard />
                <span>Dashboard</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname.startsWith('/smart-mess')} tooltip="Daily Menu">
              <Link href="/smart-mess">
                <Utensils />
                <span>Meal Booking</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === '/history'} tooltip="My History">
              <Link href="/history">
                <History />
                <span>Consumption History</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname.startsWith('/profile')} tooltip="Dietary Info">
              <Link href={user ? `/profile/${user.uid}` : '/login'}>
                <AlertTriangle />
                <span>Allergies & Preferences</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {isAdmin && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === '/admin'} tooltip="Admin Panel">
                <Link href="/admin">
                  <ShieldCheck className="text-primary" />
                  <span>Admin Settings</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        {isUserLoading ? (
          <div className="flex h-12 w-full items-center gap-3 p-2">
            <Skeleton className="size-8 rounded-full" />
            <div
              className="flex flex-col gap-1"
              style={{ opacity: state === 'expanded' ? 1 : 0, transition: 'opacity 0.2s', width: state === 'expanded' ? '100px' : 0, overflow: 'hidden' }}
            >
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-4/5" />
            </div>
          </div>
        ) : user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start h-12">
                <div className="flex justify-between items-center w-full">
                  <div className="flex gap-3 items-center text-left">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.photoURL || `https://picsum.photos/seed/${user.uid}/40/40`} alt={user.displayName || 'User'} />
                      <AvatarFallback>{user.email?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div
                      className="flex flex-col"
                      style={{ opacity: state === 'expanded' ? 1 : 0, transition: 'opacity 0.2s', width: state === 'expanded' ? 'auto' : 0, overflow: 'hidden' }}
                    >
                      <span className="text-sm font-medium text-sidebar-foreground truncate">{user.displayName || user.email}</span>
                      <span className="text-xs text-sidebar-foreground/70 truncate">{user.email}</span>
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4 text-sidebar-foreground/70" style={{ opacity: state === 'expanded' ? 1 : 0, transition: 'opacity 0.2s' }} />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 mb-2" side="top" align="start">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/profile/${user.uid}`}>
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <SidebarMenuItem className="p-2">
            <SidebarMenuButton asChild tooltip="Log In">
              <Link href="/login">
                <LogIn />
                <span>Log In</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}