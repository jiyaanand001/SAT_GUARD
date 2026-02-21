// import { useState } from 'react';
// import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
// import {
//   LayoutDashboard, Upload, MapPin, BarChart3, Eye, AlertTriangle,
//   Bell, Search, Menu, X, ChevronRight, User, LogOut, HelpCircle, Shield
// } from 'lucide-react';
// import { Badge } from '@/components/ui/badge';
// import { Input } from '@/components/ui/input';
// import { Button } from '@/components/ui/button';
// import {
//   DropdownMenu, DropdownMenuContent, DropdownMenuItem,
//   DropdownMenuSeparator, DropdownMenuTrigger
// } from '@/components/ui/dropdown-menu';
// import { useNotifications } from '@/hooks/useApi';
// import { getSession, clearSession } from '@/pages/Login';

// const navItems = [
//   { title: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
//   { title: 'Upload Detection', path: '/upload', icon: Upload },
//   { title: 'All Sites', path: '/sites', icon: MapPin },
//   { title: 'Statistics', path: '/statistics', icon: BarChart3 },
//   { title: 'Monitoring Queue', path: '/monitoring', icon: Eye },
//   { title: 'High Risk Areas', path: '/high-risk', icon: AlertTriangle },
//   { title: 'Notifications', path: '/notifications', icon: Bell },
// ];

// const breadcrumbMap: Record<string, string> = {
//   '/dashboard': 'Dashboard',
//   '/upload': 'Upload Detection',
//   '/sites': 'All Sites',
//   '/statistics': 'Statistics',
//   '/monitoring': 'Monitoring Queue',
//   '/high-risk': 'High Risk Areas',
//   '/notifications': 'Notifications',
// };

// export default function DashboardLayout() {
//   const [sidebarOpen, setSidebarOpen] = useState(true);
//   const [mobileOpen, setMobileOpen] = useState(false);
//   const location = useLocation();
//   const navigate = useNavigate();
//   const { data: notifData } = useNotifications();
//   const unreadCount = notifData?.unread_count ?? 0;
//   const session = getSession();

//   const currentPage = breadcrumbMap[location.pathname] || 'Page';
//   const initials = session?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'AS';

//   const handleLogout = () => {
//     clearSession();
//     navigate('/login');
//   };

//   return (
//     <div className="flex h-screen overflow-hidden bg-background">
//       {mobileOpen && (
//         <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
//       )}

//       <aside className={`
//         fixed lg:static inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-sidebar
//         transition-all duration-300 ease-in-out
//         ${sidebarOpen ? 'w-64' : 'w-[70px]'}
//         ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
//       `}>
//         <div className="flex items-center gap-3 px-4 py-5 border-b border-border">
//           <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center">
//             <Shield className="w-5 h-5 text-primary" />
//           </div>
//           {sidebarOpen && (
//             <div className="overflow-hidden">
//               <h1 className="text-sm font-bold text-foreground truncate">SATGUARD</h1>
//               <p className="text-[10px] text-muted-foreground">Mining Detection v2.0</p>
//             </div>
//           )}
//         </div>

//         <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
//           {navItems.map(item => {
//             const isActive = location.pathname === item.path;
//             const Icon = item.icon;
//             return (
//               <Link
//                 key={item.path}
//                 to={item.path}
//                 onClick={() => setMobileOpen(false)}
//                 className={`nav-item ${isActive ? 'nav-item-active' : ''}`}
//               >
//                 <Icon className="w-5 h-5 flex-shrink-0" />
//                 {sidebarOpen && <span className="truncate">{item.title}</span>}
//                 {sidebarOpen && item.title === 'Notifications' && unreadCount > 0 && (
//                   <Badge variant="destructive" className="ml-auto text-[10px] h-5 min-w-5 flex items-center justify-center">
//                     {unreadCount}
//                   </Badge>
//                 )}
//               </Link>
//             );
//           })}
//         </nav>

//         {sidebarOpen && (
//           <div className="border-t border-border p-4">
//             <div className="flex items-center gap-3">
//               <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold">{initials}</div>
//               <div className="overflow-hidden">
//                 <p className="text-sm font-medium text-foreground truncate">{session?.name || 'Officer'}</p>
//                 <p className="text-[11px] text-muted-foreground">{session?.role || 'Officer'}</p>
//               </div>
//             </div>
//           </div>
//         )}
//       </aside>

//       <div className="flex-1 flex flex-col overflow-hidden">
//         <header className="h-14 border-b border-border flex items-center justify-between px-4 bg-card/50 backdrop-blur-sm flex-shrink-0">
//           <div className="flex items-center gap-3">
//             <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)}>
//               <Menu className="w-5 h-5" />
//             </Button>
//             <Button variant="ghost" size="icon" className="hidden lg:flex" onClick={() => setSidebarOpen(!sidebarOpen)}>
//               {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
//             </Button>
//             <div className="hidden sm:flex items-center text-sm text-muted-foreground">
//               <span>Home</span>
//               <ChevronRight className="w-3.5 h-3.5 mx-1" />
//               <span className="text-foreground font-medium">{currentPage}</span>
//             </div>
//           </div>

//           <div className="hidden md:block w-72">
//             <div className="relative">
//               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
//               <Input placeholder="Search detections..." className="pl-9 h-9 bg-secondary/50 border-border" />
//             </div>
//           </div>

//           <div className="flex items-center gap-2">
//             <DropdownMenu>
//               <DropdownMenuTrigger asChild>
//                 <Button variant="ghost" size="icon" className="relative">
//                   <Bell className="w-5 h-5" />
//                   {unreadCount > 0 && (
//                     <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-destructive text-[10px] text-destructive-foreground flex items-center justify-center font-bold">
//                       {unreadCount}
//                     </span>
//                   )}
//                 </Button>
//               </DropdownMenuTrigger>
//               <DropdownMenuContent align="end" className="w-80 bg-card border-border">
//                 <div className="px-3 py-2 border-b border-border">
//                   <p className="text-sm font-semibold">Notifications</p>
//                 </div>
//                 {(notifData?.notifications || []).slice(0, 4).map(n => (
//                   <DropdownMenuItem key={n.id} className="flex flex-col items-start gap-1 py-3 cursor-pointer">
//                     <div className="flex items-center gap-2 w-full">
//                       {!n.read && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
//                       <span className="text-sm font-medium truncate">{n.location}</span>
//                     </div>
//                     <p className="text-xs text-muted-foreground line-clamp-1">{n.message}</p>
//                   </DropdownMenuItem>
//                 ))}
//                 <DropdownMenuSeparator className="bg-border" />
//                 <DropdownMenuItem asChild className="justify-center cursor-pointer">
//                   <Link to="/notifications" className="text-sm text-primary text-center w-full">View All</Link>
//                 </DropdownMenuItem>
//               </DropdownMenuContent>
//             </DropdownMenu>

//             <DropdownMenu>
//               <DropdownMenuTrigger asChild>
//                 <Button variant="ghost" size="icon">
//                   <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">{initials}</div>
//                 </Button>
//               </DropdownMenuTrigger>
//               <DropdownMenuContent align="end" className="w-48 bg-card border-border">
//                 <DropdownMenuItem><User className="w-4 h-4 mr-2" /> Profile</DropdownMenuItem>
//                 <DropdownMenuItem><HelpCircle className="w-4 h-4 mr-2" /> Help</DropdownMenuItem>
//                 <DropdownMenuSeparator className="bg-border" />
//                 <DropdownMenuItem className="text-destructive" onClick={handleLogout}>
//                   <LogOut className="w-4 h-4 mr-2" /> Logout
//                 </DropdownMenuItem>
//               </DropdownMenuContent>
//             </DropdownMenu>
//           </div>
//         </header>

//         <main className="flex-1 overflow-y-auto p-4 lg:p-6">
//           <Outlet />
//         </main>
//       </div>
//     </div>
//   );
// }


import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { useNotifications } from '@/hooks/useApi';
import { clearSession, getSession } from '@/pages/Login';
import {
  AlertTriangle,
  BarChart3,
  Bell,
  ChevronRight,
  Eye,
  GitCompare,
  HelpCircle,
  Layers,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Search,
  Shield,
  Upload,
  User,
  X
} from 'lucide-react';
import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';

const navItems = [
  { title: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { title: 'Upload Detection', path: '/upload', icon: Upload },
  { title: 'All Sites', path: '/sites', icon: MapPin },
  { title: 'Mining Sites Map', path: '/mining-sites', icon: Layers },
  { title: 'Statistics', path: '/statistics', icon: BarChart3 },
  { title: 'Monitoring Queue', path: '/monitoring', icon: Eye },
  { title: 'High Risk Areas', path: '/high-risk', icon: AlertTriangle },
  { title: 'Notifications', path: '/notifications', icon: Bell },
  { title: 'Compare Sites', path: '/comparison', icon: GitCompare },
];

const breadcrumbMap: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/upload': 'Upload Detection',
  '/sites': 'All Sites',
  '/mining-sites': 'Mining Sites Map',
  '/statistics': 'Statistics',
  '/monitoring': 'Monitoring Queue',
  '/high-risk': 'High Risk Areas',
  '/notifications': 'Notifications',
  '/comparison': 'Compare Sites',
};

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { data: notifData } = useNotifications();
  const unreadCount = notifData?.unread_count ?? 0;
  const session = getSession();

  const currentPage = breadcrumbMap[location.pathname] || 'Page';
  const initials = session?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'AS';

  const handleLogout = () => {
    clearSession();
    navigate('/login');
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-sidebar
        transition-all duration-300 ease-in-out
        ${sidebarOpen ? 'w-64' : 'w-[70px]'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex items-center gap-3 px-4 py-5 border-b border-border">
          <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <h1 className="text-sm font-bold text-foreground truncate">SATGUARD</h1>
              <p className="text-[10px] text-muted-foreground">Mining Detection v2.0</p>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map(item => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`nav-item ${isActive ? 'nav-item-active' : ''}`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="truncate">{item.title}</span>}
                {sidebarOpen && item.title === 'Notifications' && unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-auto text-[10px] h-5 min-w-5 flex items-center justify-center">
                    {unreadCount}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>

        {sidebarOpen && (
          <div className="border-t border-border p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold">{initials}</div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-foreground truncate">{session?.name || 'Officer'}</p>
                <p className="text-[11px] text-muted-foreground">{session?.role || 'Officer'}</p>
              </div>
            </div>
          </div>
        )}
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 border-b border-border flex items-center justify-between px-4 bg-card/50 backdrop-blur-sm flex-shrink-0">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)}>
              <Menu className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="hidden lg:flex" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
            <div className="hidden sm:flex items-center text-sm text-muted-foreground">
              <span>Home</span>
              <ChevronRight className="w-3.5 h-3.5 mx-1" />
              <span className="text-foreground font-medium">{currentPage}</span>
            </div>
          </div>

          <div className="hidden md:block w-72">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search detections..." className="pl-9 h-9 bg-secondary/50 border-border" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-destructive text-[10px] text-destructive-foreground flex items-center justify-center font-bold">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 bg-card border-border">
                <div className="px-3 py-2 border-b border-border">
                  <p className="text-sm font-semibold">Notifications</p>
                </div>
                {(notifData?.notifications || []).slice(0, 4).map(n => (
                  <DropdownMenuItem key={n.id} className="flex flex-col items-start gap-1 py-3 cursor-pointer">
                    <div className="flex items-center gap-2 w-full">
                      {!n.read && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
                      <span className="text-sm font-medium truncate">{n.location}</span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">{n.message}</p>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem asChild className="justify-center cursor-pointer">
                  <Link to="/notifications" className="text-sm text-primary text-center w-full">View All</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">{initials}</div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-card border-border">
                <DropdownMenuItem><User className="w-4 h-4 mr-2" /> Profile</DropdownMenuItem>
                <DropdownMenuItem><HelpCircle className="w-4 h-4 mr-2" /> Help</DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem className="text-destructive" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
