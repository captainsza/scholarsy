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
  Search
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/Badge";
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

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const pathname = usePathname();
  const router = useRouter();

  // Close sidebar on smaller screens by default
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    // Set initial state
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Handle logout with confirmation
  const handleLogout = async () => {
    try {
      await logout();
      setIsLogoutDialogOpen(false);
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of the system",
      });
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      toast({
        title: "Logout failed",
        description: "An error occurred during logout",
        variant: "destructive",
      });
    }
  };

  // Navigation items with icon, label, path, and badge
  const navItems = [
    { icon: Home, label: "Dashboard", path: "/admin/dashboard" },
    { 
      icon: Users, 
      label: "User Management", 
      path: "/admin/users",
      badge: { value: "New", variant: "blue" } 
    },
    { icon: GraduationCap, label: "Students", path: "/admin/students" },
    { icon: ClipboardList, label: "Faculty", path: "/admin/faculty" },
    { icon: BookOpen, label: "Courses", path: "/admin/courses" },
    { icon: Building, label: "Departments", path: "/admin/departments" },
    { icon: Bell, label: "Notices", path: "/admin/notices" },
    { icon: Calendar, label: "Schedule", path: "/admin/schedule" },
    { icon: BarChart3, label: "Reports", path: "/admin/reports" },
    { icon: Settings, label: "Settings", path: "/admin/settings" },
  ];

  return (
    <div className="h-screen flex overflow-hidden bg-gradient-to-br from-gray-50 to-blue-50/40">
      {/* Mobile Navigation Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence>
        {(isSidebarOpen || isMobileMenuOpen) && (
          <motion.aside
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: "spring", bounce: 0.1, duration: 0.4 }}
            className={`fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-100 shadow-lg lg:shadow-none z-40 lg:static flex flex-col`}
          >
            {/* Sidebar Header */}
            <div className="flex items-center justify-between h-16 px-4 border-b">
              <Link href="/admin/dashboard" className="flex items-center">
                <div className="w-8 h-8 rounded-md bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mr-2">
                  <span className="text-white font-bold text-lg">S</span>
                </div>
                <span className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                  ScholarSync
                </span>
              </Link>
              <button
                onClick={() => {
                  if (window.innerWidth < 1024) {
                    setIsMobileMenuOpen(false);
                  } else {
                    setIsSidebarOpen(false);
                  }
                }}
                className="p-1 rounded-md hover:bg-gray-100 lg:hidden"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 pt-4 pb-4 px-2 overflow-y-auto">
              <ul className="space-y-1">
                {navItems.map((item) => (
                  <li key={item.path}>
                    <TooltipProvider delayDuration={300}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link
                            href={item.path}
                            className={`flex items-center px-4 py-3 rounded-lg transition-all group relative ${
                              pathname === item.path
                                ? "bg-blue-50 text-blue-700"
                                : "hover:bg-gray-50 text-gray-700 hover:text-blue-600"
                            }`}
                          >
                            {pathname === item.path && (
                              <motion.div
                                layoutId="activeNav"
                                className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-blue-600 rounded-r-full"
                              />
                            )}
                            <item.icon
                              className={`h-5 w-5 mr-3 ${
                                pathname === item.path
                                  ? "text-blue-600"
                                  : "text-gray-500 group-hover:text-blue-600"
                              }`}
                            />
                            <span className="flex-1">{item.label}</span>
                            {item.badge && (
                              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-600">
                                {item.badge.value}
                              </span>
                            )}
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent side="right">{item.label}</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </li>
                ))}
              </ul>
            </nav>

            {/* User Profile */}
            <div className="border-t border-gray-100 p-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center w-full px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <Avatar className="h-8 w-8 mr-2 border border-gray-200">
                      <AvatarImage src={user?.profile?.profileImage || ""} />
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        {user?.profile?.firstName?.[0]}
                        {user?.profile?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium">
                        {user?.profile?.firstName} {user?.profile?.lastName}
                      </p>
                      <p className="text-xs text-gray-500">Administrator</p>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuItem 
                    onClick={() => router.push("/admin/profile")}
                    className="cursor-pointer"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => router.push("/admin/settings")}
                    className="cursor-pointer"
                  >
                    <Settings className="h-4 w-4 mr-2" />
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
        <header className="bg-white border-b border-gray-100 shadow-sm z-10">
          <div className="flex items-center justify-between h-16 px-4 lg:px-6">
            {/* Left: Toggle and Breadcrumbs */}
            <div className="flex items-center gap-4">
              {/* Sidebar Toggle */}
              <button
                onClick={() => {
                  if (window.innerWidth < 1024) {
                    setIsMobileMenuOpen(!isMobileMenuOpen);
                  } else {
                    setIsSidebarOpen(!isSidebarOpen);
                  }
                }}
                className="p-2 rounded-md hover:bg-gray-100 transition-colors"
                aria-label="Toggle sidebar"
              >
                <Menu size={20} className="text-gray-600" />
              </button>

              {/* Breadcrumb */}
              <nav className="hidden sm:flex items-center text-sm">
                <Link href="/admin/dashboard" className="text-gray-500 hover:text-blue-600">
                  Admin
                </Link>
                <span className="mx-2 text-gray-400">/</span>
                <span className="text-gray-800 font-medium">
                  {pathname === "/admin/dashboard"
                    ? "Dashboard"
                    : (pathname.split("/").pop() || "").charAt(0).toUpperCase() +
                      (pathname.split("/").pop() || "").slice(1)}
                </span>
              </nav>
            </div>

            {/* Right: Search, Notifications, User */}
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className={`relative ${isSearchExpanded ? 'w-64' : 'w-40'} transition-all duration-300`}>
                <Input
                  placeholder="Search..."
                  className="pl-9 h-9 bg-gray-50 border-gray-200 focus:bg-white"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchExpanded(true)}
                  onBlur={() => setIsSearchExpanded(false)}
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              </div>

              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5 text-gray-600" />
                <span className="absolute top-0 right-0 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white"></span>
              </Button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto bg-transparent">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Logout Confirmation Dialog */}
      <Dialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Logout</DialogTitle>
            <DialogDescription>
              Are you sure you want to log out of the administration panel?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-3">
            <div className="rounded-full bg-yellow-50 p-3">
              <AlertTriangle className="h-6 w-6 text-yellow-500" />
            </div>
          </div>
          <DialogFooter className="sm:justify-center gap-2 mt-2">
            <Button
              variant="outline"
              onClick={() => setIsLogoutDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="default" 
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              onClick={handleLogout}
            >
              Yes, Log Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
