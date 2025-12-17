'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  LayoutDashboard, Car, MapPin, Wrench, BarChart, Menu, Calendar, 
  Settings, Users, FileText, ChevronRight, Bell, ClipboardCheck 
} from 'lucide-react';

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  badge?: number | string;
  variant?: 'default' | 'warning' | 'destructive';
  subItems?: NavItem[];
}

const mainNavItems: NavItem[] = [
  {
    title: 'Domů',
    href: '/homepage',
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    title: 'Vozidla',
    href: '/dashboard/auta',
    icon: <Car className="h-5 w-5" />,
  },
  {
    title: 'Reporty',
    href: '/dashboard/reports',
    icon: <BarChart className="h-5 w-5" />,
  },
  {
    title: 'Kalendář',
    href: '/dashboard/calendar',
    icon: <Calendar className="h-5 w-5" />,
  },
  {
    title: 'Nastavení',
    href: '/dashboard/settings',
    icon: <Settings className="h-5 w-5" />,
  },
];

const DashboardNav: React.FC = () => {
  const pathname = usePathname() || '';

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-64 bg-background border-r">
        <div className="flex items-center h-16 px-4">
          {/* Logo */}
        </div>
        <ScrollArea className="h-[calc(100%-4rem)]">
          <div className="space-y-4">
            {mainNavItems.map((item) => (
              <NavItem key={item.title} item={item} pathname={pathname} />
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main content */}
      <div className="flex-1 p-6 space-y-6">
        {/* Rest of the component */}
      </div>
    </div>
  );
};

const NavItem: React.FC<{ item: NavItem; pathname: string }> = ({ item, pathname }) => {
  const isActive = pathname === item.href;

  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center px-4 py-2 text-sm font-medium transition-colors hover:bg-accent',
        isActive ? 'bg-accent' : 'text-muted-foreground'
      )}
    >
      {item.icon}
      <span className="ml-3">{item.title}</span>
    </Link>
  );
};

export default DashboardNav; 