"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  User,
  Home,
  BarChart3,
  Users,
  GraduationCap,
  Calendar,
  Settings,
  Bell,
  LogOut,
  ChevronDown,
  Menu,
  X,
  AlertTriangle,
  BookOpen,
  ClipboardList,
  Building,
  Search,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/components/ui/toastall";

// Type definitions
interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  badge?: { value: string; variant: string };
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth >= 1024);
      setIsMobileMenuOpen(false);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await logout();
      setIsLogoutDialogOpen(false);
      toast({ title: "Logged Out", description: "See you soon!" });
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      toast({
        title: "Error",
        description: "Logout failed. Please try again.",
        variant: "destructive",
      });
    }
  };

  const navItems: NavItem[] = [
    { icon: Home, label: "Dashboard", path: "/admin/dashboard" },
    { icon: Users, label: "Users", path: "/admin/users", badge: { value: "New", variant: "cyan" } },
    { icon: GraduationCap, label: "Students", path: "/admin/students" },
    { icon: ClipboardList, label: "Faculty", path: "/admin/faculty" },
    { icon: BookOpen, label: "Courses", path: "/admin/courses" },
    { icon: Bell, label: "Notices", path: "/admin/notices" },
    { icon: Calendar, label: "Schedule", path: "/admin/schedule" },
    { icon: Settings, label: "Settings", path: "/admin/settings" },
  ];

  return (
    <div className="h-screen flex overflow-hidden bg-gradient-to-br from-cyan-50/50 to-blue-100/50">
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {(isSidebarOpen || isMobileMenuOpen) && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 left-0 w-64 bg-white/80 backdrop-blur-md border-r border-cyan-100/50 z-40 lg:static flex flex-col shadow-lg"
          >
            {/* Sidebar Header */}
            <div className="flex items-center justify-between h-16 px-4 border-b border-cyan-100/50">
              <Link href="/admin/dashboard" className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mr-2 shadow-md">
                  <span className="text-white font-bold text-lg">S</span>
                </div>
                <span className="text-xl font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
                  ScholarSync
                </span>
              </Link>
              <button
                onClick={() => (window.innerWidth < 1024 ? setIsMobileMenuOpen(false) : setIsSidebarOpen(false))}
                className="p-1 rounded-full hover:bg-cyan-50/50 transition-colors lg:hidden"
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 pt-4 pb-4 px-2 overflow-y-auto">
              <ul className="space-y-1">
                {navItems.map((item) => (
                  <li key={item.path}>
                    <TooltipProvider delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link
                            href={item.path}
                            className={`flex items-center px-4 py-3 rounded-xl transition-all group relative ${
                              pathname === item.path
                                ? "bg-cyan-50/50 text-cyan-700"
                                : "text-gray-700 hover:bg-cyan-50/50 hover:text-cyan-600"
                            }`}
                          >
                            {pathname === item.path && (
                              <motion.div
                                layoutId="activeNav"
                                className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-cyan-500 rounded-r-full"
                              />
                            )}
                            <item.icon
                              className={`h-5 w-5 mr-3 ${
                                pathname === item.path
                                  ? "text-cyan-600"
                                  : "text-gray-500 group-hover:text-cyan-600"
                              }`}
                            />
                            <span className="flex-1">{item.label}</span>
                            {item.badge && (
                              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-cyan-100 text-cyan-600">
                                {item.badge.value}
                              </span>
                            )}
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="bg-cyan-600 text-white">
                          {item.label}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </li>
                ))}
              </ul>
            </nav>

            {/* User Profile */}
            <div className="border-t border-cyan-100/50 p-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center w-full px-3 py-2 rounded-xl hover:bg-cyan-50/50 transition-all">
                    <Avatar className="h-8 w-8 mr-2 border border-cyan-200/50">
                      <AvatarImage src={user?.profile?.profileImage || ""} />
                      <AvatarFallback className="bg-cyan-100 text-cyan-600">
                        {user?.profile?.firstName?.[0]}
                        {user?.profile?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-gray-900">
                        {user?.profile?.firstName} {user?.profile?.lastName}
                      </p>
                      <p className="text-xs text-gray-500">Administrator</p>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56 bg-white/95 backdrop-blur-md border-cyan-100/50">
                  <DropdownMenuItem onClick={() => router.push("/admin/profile")} className="cursor-pointer">
                    <User className="h-4 w-4 mr-2 text-cyan-600" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/admin/settings")} className="cursor-pointer">
                    <Settings className="h-4 w-4 mr-2 text-cyan-600" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setIsLogoutDialogOpen(true)}
                    className="text-red-600 cursor-pointer hover:text-red-700 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden h-full">
        {/* Top Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-cyan-100/50 shadow-sm z-10">
          <div className="flex items-center justify-between h-16 px-4 lg:px-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() =>
                  window.innerWidth < 1024
                    ? setIsMobileMenuOpen(!isMobileMenuOpen)
                    : setIsSidebarOpen(!isSidebarOpen)
                }
                className="p-2 rounded-full hover:bg-cyan-50 transition-colors"
                aria-label="Toggle sidebar"
              >
                <Menu size={20} className="text-cyan-600" />
              </button>
              <nav className="hidden sm:flex items-center text-sm">
                <Link href="/admin/dashboard" className="text-gray-600 hover:text-cyan-600">
                  Admin
                </Link>
                <span className="mx-2 text-gray-400">/</span>
                <span className="text-gray-900 font-medium bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
                  {pathname.split("/").pop()?.replace(/^\w/, (c) => c.toUpperCase()) || "Dashboard"}
                </span>
              </nav>
            </div>
            <div className="flex items-center gap-3">
              <div
                className={`relative transition-all duration-300 ${isSearchExpanded ? "w-64" : "w-40"}`}
              >
                <Input
                  placeholder="Search..."
                  className="pl-9 h-9 bg-cyan-50/50 border-cyan-200/50 focus:bg-white focus:border-cyan-400 rounded-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchExpanded(true)}
                  onBlur={() => setIsSearchExpanded(false)}
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-cyan-500" />
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="relative rounded-full hover:bg-cyan-50"
              >
                <Bell className="h-5 w-5 text-cyan-600" />
                <span className="absolute top-0 right-0 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white"></span>
              </Button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto bg-transparent p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Logout Dialog */}
      <Dialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-md border-cyan-100/50">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Confirm Logout</DialogTitle>
            <DialogDescription className="text-gray-600">
              Are you sure you want to leave the admin panel?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-3">
            <div className="rounded-full bg-cyan-50 p-3">
              <AlertTriangle className="h-6 w-6 text-cyan-500" />
            </div>
          </div>
          <DialogFooter className="sm:justify-center gap-3 mt-2">
            <Button
              variant="outline"
              onClick={() => setIsLogoutDialogOpen(false)}
              className="border-cyan-200 text-cyan-600 hover:bg-cyan-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleLogout}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white"
            >
              Log Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}