"use client";

import { useAuth } from "@/context/AuthContext";
import { JSX, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, X } from "lucide-react";

// Type definitions
interface Feature {
  title: string;
  description: string;
  icon: JSX.Element;
  accentColor: string;
}

interface Testimonial {
  quote: string;
  name: string;
  title: string;
  color: string;
}

export default function Home() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && !loading && user) {
      const redirectPaths: Record<string, string> = {
        ADMIN: "/admin/dashboard",
        FACULTY: "/faculty/dashboard",
        STUDENT: "/student/dashboard",
      };
      router.push(redirectPaths[user.role] || "/student/dashboard");
    }
  }, [user, loading, router, isClient]);

  const handleLogout = async () => {
    await logout();
    setShowLogoutModal(false);
    router.push("/login");
  };

  if (loading || !isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 to-blue-100">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-16 h-16 border-4 border-t-cyan-500 border-r-blue-500 border-b-transparent border-l-transparent rounded-full"
          />
          <p className="mt-4 text-cyan-600 font-semibold text-lg">Initializing ScholarSync...</p>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cyan-50/50 to-blue-100/50 font-sans overflow-hidden">
        {/* Header */}
        <motion.header
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          className="fixed w-full z-50 bg-white/80 backdrop-blur-md shadow-sm"
        >
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
              ScholarSync
            </Link>
            <nav className="flex items-center gap-6">
              <Link href="/login" className="text-gray-600 hover:text-cyan-600 transition-colors">
                Login
              </Link>
              <Link
                href="/register"
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-full hover:from-cyan-600 hover:to-blue-600 transition-all"
              >
                Get Started
              </Link>
            </nav>
          </div>
        </motion.header>

        {/* Hero Section */}
        <section className="pt-32 pb-20 relative">
          <div className="max-w-7xl mx-auto px-4 flex flex-col lg:flex-row items-center gap-12">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="lg:w-1/2"
            >
              <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight">
                <span className="block">Empower</span>
                <span className="block bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
                  Education
                </span>
              </h1>
              <p className="mt-6 text-xl text-gray-600/90 max-w-lg">
                Revolutionize academic management with cutting-edge technology and intuitive design.
              </p>
              <div className="mt-8 flex gap-4">
                <Link
                  href="/register"
                  className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-full hover:scale-105 transition-transform"
                >
                  Start Now
                </Link>
                <Link
                  href="/login"
                  className="px-6 py-3 border border-cyan-500 text-cyan-600 rounded-full hover:bg-cyan-50 transition-colors"
                >
                  Login
                </Link>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="lg:w-1/2 relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-200/30 to-blue-200/30 rounded-3xl transform rotate-6" />
              <Image
                src="/dashboard.png"
                alt="Dashboard Preview"
                width={600}
                height={400}
                className="relative z-10 rounded-2xl shadow-2xl"
                priority
              />
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-white/80 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-bold text-gray-900">Next-Gen Features</h2>
              <p className="mt-4 text-lg text-gray-600/90 max-w-2xl mx-auto">
                Discover powerful tools designed for modern education management.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {([
                {
                  title: "Smart Attendance",
                  description: "AI-powered attendance tracking with real-time analytics.",
                  icon: <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 20v-6m0-8V4m0 16a8 8 0 100-16 8 8 0 000 16z" strokeWidth="2" strokeLinecap="round" /></svg>,
                  accentColor: "cyan",
                },
                {
                  title: "Dynamic Scheduling",
                  description: "Automated scheduling with conflict resolution.",
                  icon: <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeWidth="2" strokeLinecap="round" /></svg>,
                  accentColor: "blue",
                },
                {
                  title: "Grade Insights",
                  description: "Advanced grade management with predictive analytics.",
                  icon: <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" strokeWidth="2" strokeLinecap="round" /></svg>,
                  accentColor: "indigo",
                },
              ] as Feature[]).map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2 }}
                  className="p-6 bg-white/70backdrop-blur-lg rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                  <div className={`text-${feature.accentColor}-500 mb-4`}>{feature.icon}</div>
                  <h3 className="text-xl font-semibold text-gray-900">{feature.title}</h3>
                  <p className="mt-2 text-gray-600/90">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 bg-gradient-to-r from-cyan-50/30 to-blue-50/30">
          <div className="max-w-7xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-bold text-gray-900">Voices of Success</h2>
              <p className="mt-4 text-lg text-gray-600/90">Hear from our community.</p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {([
                { quote: "Transformed our academic workflow!", name: "Dr. Emma Lee", title: "Dean", color: "cyan" },
                { quote: "So intuitive and powerful.", name: "James Parker", title: "Student", color: "blue" },
                { quote: "Real-time insights are a game-changer.", name: "Lisa Chen", title: "Admin", color: "indigo" },
              ] as Testimonial[]).map((t, i) => (
                <motion.div
                  key={t.name}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2 }}
                  className={`p-6 bg-white/60 backdrop-blur-md rounded-xl shadow-md border-t-4 border-${t.color}-500`}
                >
                  <p className="text-gray-700 italic">"{t.quote}"</p>
                  <div className="mt-4 flex items-center">
                    <div className={`w-10 h-10 rounded-full bg-${t.color}-100 flex items-center justify-center`}>
                      <span className={`text-${t.color}-600 font-bold`}>{t.name[0]}</span>
                    </div>
                    <div className="ml-3">
                      <p className="font-medium text-gray-900">{t.name}</p>
                      <p className="text-sm text-gray-600">{t.title}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-gradient-to-r from-cyan-500 to-blue-600 text-white">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <motion.h2
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-4xl font-bold"
            >
              Ready to Elevate Your Institution?
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="mt-4 text-lg max-w-2xl mx-auto"
            >
              Join the future of education management today.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="mt-8 flex justify-center gap-4"
            >
              <Link
                href="/register"
                className="px-8 py-3 bg-white text-cyan-600 rounded-full hover:bg-gray-100 transition-all"
              >
                Join Now
              </Link>
              <Link
                href="/contact"
                className="px-8 py-3 bg-cyan-400/20 text-white rounded-full hover:bg-cyan-400/30 transition-all"
              >
                Contact Us
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-gray-300 py-12">
          <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                ScholarSync
              </h3>
              <p className="mt-4 text-sm">Pioneering the future of education management.</p>
            </div>
            <div>
              <h4 className="font-semibold text-white">Quick Links</h4>
              <ul className="mt-4 space-y-2">
                {["Features", "Pricing", "Support", "Docs"].map((item) => (
                  <li key={item}>
                    <Link href="#" className="hover:text-cyan-400 transition-colors">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white">Connect</h4>
              <ul className="mt-4 space-y-2">
                {["Twitter", "LinkedIn", "GitHub", "Email"].map((item) => (
                  <li key={item}>
                    <Link href="#" className="hover:text-cyan-400 transition-colors">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-8 text-center text-sm">© {new Date().getFullYear()} ScholarSync. All rights reserved.</div>
        </footer>

        {/* Logout Modal */}
        <AnimatePresence>
          {showLogoutModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white/90 backdrop-blur-md p-6 rounded-xl max-w-md w-full mx-4"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">Confirm Logout</h3>
                  <button onClick={() => setShowLogoutModal(false)} className="text-gray-600 hover:text-gray-900">
                    <X size={24} />
                  </button>
                </div>
                <p className="text-gray-600 mb-6">Are you sure you want to log out of ScholarSync?</p>
                <div className="flex justify-end gap-4">
                  <button
                    onClick={() => setShowLogoutModal(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-900"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-full hover:from-cyan-600 hover:to-blue-600"
                  >
                    Logout
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return null;
}