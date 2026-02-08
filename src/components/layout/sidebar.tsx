'use client';

import {
  BookCopy,
  LayoutDashboard,
  Shield,
  Users,
  Utensils,
  ChevronDown,
  LogOut,
  LogIn,
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
import { useAuth, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';
import { Skeleton } from '../ui/skeleton';

export function AppSidebar() {
  const { state } = useSidebar();
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <svg
            className="size-8 text-primary"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 256 256"
          >
            <path
              fill="currentColor"
              d="M228 128a12 12 0 0 1-12 12h-24.57a48.16 48.16 0 0 1-4.21 16.59a48 48 0 0 1-38.63 27.41H128a12 12 0 0 1 0-24h20.59a24 24 0 0 0 23.58-20.1a24.23 24.23 0 0 0-1.25-11.49a12 12 0 1 1 22.49-8.74A48.21 48.21 0 0 1 188.57 128H216a12 12 0 0 1 12 12Zm-76.23-73.66a12 12 0 0 0-13.06-4.94L38.46 82.34A12 12 0 0 0 31.7 94.66l98.24 39.3a12 12 0 0 0 13.06-4.94l56.76-113.54a12 12 0 0 0-4.94-13.06ZM157.41 128l-41.1-16.44l-41.1 16.44l41.1 16.44Z"
            />
          </svg>
          <span
            className="text-xl font-semibold text-primary"
            style={{ opacity: state === 'expanded' ? 1 : 0, transition: 'opacity 0.2s' }}
          >
            IILM University
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
            <SidebarMenuButton asChild isActive={pathname.startsWith('/lms')} tooltip="LMS">
              <Link href="/lms">
                <BookCopy />
                <span>LMS Portal</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname.startsWith('/collabnest')} tooltip="CollabNest">
              <Link href="/collabnest">
                <Users />
                <span>CollabNest</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname.startsWith('/smart-mess')} tooltip="Mess">
              <Link href="/smart-mess">
                <Utensils />
                <span>Smart Mess</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname.startsWith('/admin')} tooltip="Admin">
              <Link href="/admin">
                <Shield />
                <span>Admin Panel</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
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
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
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
