import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';

const MainSidebar = () => {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full">
      {/* Rest of the component content */}
      <Link 
        href="/dashboard/auta"
        className={cn(
          "flex items-center py-2 px-3 text-sm rounded-md",
          pathname === "/dashboard/auta" 
            ? "bg-white/10 text-white" 
            : "text-white/80 hover:bg-white/10 hover:text-white"
        )}
      >
        <MapPin className="h-4 w-4 mr-3" />
        <span>Vozidla</span>
      </Link>
    </div>
  );
};

export default MainSidebar; 