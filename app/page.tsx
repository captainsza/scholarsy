"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  // Handle hydration issues by ensuring we only render client-specific content after mounting
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Handle redirects based on authentication state
  useEffect(() => {
    if (isClient && !loading) {
      if (user) {
        // Redirect logged-in users to their appropriate dashboard
        if (user.role === "ADMIN") router.push("/admin/dashboard");
        else if (user.role === "FACULTY") router.push("/faculty/dashboard");
        else if (user.role === "STUDENT") router.push("/student/dashboard");
      }
    }
  }, [user, loading, router, isClient]);

  // Show loading state
  if (loading || !isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-50 to-indigo-50">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center"
        >
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
          <p className="mt-4 text-blue-600 font-medium">Loading ScholarSync...</p>
        </motion.div>
      </div>
    );
  }

  // If user is already logged in, we'll redirect (handled by useEffect)
  // If not logged in, show the landing page
  if (!user) {
    return (
      <div className="min-h-screen bg-white overflow-hidden">
        {/* Header/Navigation */}
        <header className="relative bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6 md:justify-start md:space-x-10">
              <div className="flex justify-start lg:w-0 lg:flex-1">
                <span className="text-2xl font-extrabold text-blue-600">ScholarSync</span>
              </div>
              <div className="hidden md:flex items-center justify-end md:flex-1 lg:w-0 space-x-4">
                <Link 
                  href="/login" 
                  className="whitespace-nowrap text-base font-medium text-gray-500 hover:text-gray-900"
                >
                  Log in
                </Link>
                <Link 
                  href="/register" 
                  className="ml-8 whitespace-nowrap inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Register
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <div className="relative bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50">
          <div className="max-w-7xl mx-auto">
            <div className="relative z-10 pt-14 pb-8 sm:pt-24 sm:pb-16 md:pt-32 md:pb-20 lg:w-full lg:pb-28 xl:pb-32 px-4 sm:px-6 lg:px-8">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="sm:text-center lg:text-left"
              >
                <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                  <motion.span 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="block"
                  >
                    Streamline
                  </motion.span>
                  <motion.span 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="block"
                  >
                    Education Management
                  </motion.span>
                  <motion.span 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="block text-blue-600 xl:inline"
                  >
                    with ScholarSync
                  </motion.span>
                </h1>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.1 }}
                  className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0"
                >
                  A comprehensive solution for managing academic activities, faculty workload, 
                  student attendance, and administrative tasks in educational institutions.
                </motion.p>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.5 }}
                  className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start"
                >
                  <div className="rounded-md shadow">
                    <Link 
                      href="/register" 
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10"
                    >
                      Get Started
                    </Link>
                  </div>
                  <div className="mt-3 sm:mt-0 sm:ml-3">
                    <Link 
                      href="/login" 
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 md:py-4 md:text-lg md:px-10"
                    >
                      Log in
                    </Link>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
          <div className="absolute inset-y-0 right-0 hidden lg:block lg:inset-y-0 lg:right-0 lg:w-1/2">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 2, duration: 1 }}
              className="h-56 w-full object-cover sm:h-72 md:h-96 lg:w-full lg:h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-bl-3xl rounded-tl-3xl overflow-hidden"
            >
              <div className="h-full w-full flex items-center justify-center">
                <Image
                  src="/dashboard.png"
                  alt="Education Management Illustration"
                  width={500}
                  height={400}
                  className="opacity-90"
                  priority
                />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-16 bg-white overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              <h2 className="text-base font-semibold text-blue-600 tracking-wide uppercase">Features</h2>
              <p className="mt-1 text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight">
                Everything you need to manage your institution
              </p>
              <p className="max-w-3xl mt-5 mx-auto text-xl text-gray-500">
                ScholarSync provides a complete suite of tools designed specifically for educational institutions.
              </p>
            </motion.div>

            <div className="mt-16">
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                {/* Feature 1 */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2, duration: 0.8 }}
                  className="relative p-6 bg-white rounded-lg border border-gray-100 shadow-xl"
                >
                  <div>
                    <span className="absolute top-0 left-0 transform -translate-y-1/2 -translate-x-1/2 inline-flex items-center justify-center p-3 bg-blue-600 rounded-full shadow-lg">
                      <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                    </span>
                    <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">Attendance Management</h3>
                    <p className="mt-2 text-base text-gray-500">
                      Track student attendance with ease using our mobile-friendly interface. Generate reports and identify patterns automatically.
                    </p>
                  </div>
                  <div className="mt-5">
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full" style={{ width: "92%" }}></div>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">92% accuracy in attendance tracking</p>
                  </div>
                </motion.div>

                {/* Feature 2 */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4, duration: 0.8 }}
                  className="relative p-6 bg-white rounded-lg border border-gray-100 shadow-xl"
                >
                  <div>
                    <span className="absolute top-0 left-0 transform -translate-y-1/2 -translate-x-1/2 inline-flex items-center justify-center p-3 bg-indigo-600 rounded-full shadow-lg">
                      <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </span>
                    <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">Schedule Management</h3>
                    <p className="mt-2 text-base text-gray-500">
                      Plan and manage course schedules, classrooms, and faculty assignments efficiently. Avoid conflicts automatically.
                    </p>
                  </div>
                  <div className="mt-5">
                    <div className="flex justify-around">
                      <div className="text-center">
                        <span className="block text-2xl font-bold text-indigo-600">+45%</span>
                        <span className="text-sm text-gray-500">Efficiency</span>
                      </div>
                      <div className="text-center">
                        <span className="block text-2xl font-bold text-indigo-600">-30%</span>
                        <span className="text-sm text-gray-500">Scheduling conflicts</span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Feature 3 */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6, duration: 0.8 }}
                  className="relative p-6 bg-white rounded-lg border border-gray-100 shadow-xl"
                >
                  <div>
                    <span className="absolute top-0 left-0 transform -translate-y-1/2 -translate-x-1/2 inline-flex items-center justify-center p-3 bg-green-600 rounded-full shadow-lg">
                      <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </span>
                    <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">Grade Management</h3>
                    <p className="mt-2 text-base text-gray-500">
                      Record and calculate grades with our intuitive interface. Generate reports and analyze student performance.
                    </p>
                  </div>
                  <div className="mt-5">
                    <div className="bg-gray-100 p-3 rounded-lg">
                      <div className="flex justify-between items-center text-sm">
                        <div className="font-medium">Grade Analytics</div>
                        <div className="text-green-600">+24% accuracy</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>

        {/* How it works section */}
        <div className="py-16 bg-blue-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
              className="text-center"
            >
              <h2 className="text-base font-semibold text-blue-600 tracking-wide uppercase">How It Works</h2>
              <p className="mt-1 text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight">
                Simple. Efficient. Powerful.
              </p>
              <p className="max-w-3xl mt-5 mx-auto text-xl text-gray-500">
                ScholarSync is designed to be intuitive and easy to use while providing powerful features for educational management.
              </p>
            </motion.div>

            <div className="mt-16">
              <div className="flex flex-col md:flex-row justify-between items-center space-y-12 md:space-y-0 md:space-x-10">
                <motion.div 
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                  className="w-full md:w-1/2"
                >
                  <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200 relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-blue-200 rounded-full opacity-20"></div>
                    <div className="relative">
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">For Students</h3>
                      <ul className="space-y-4">
                        <li className="flex">
                          <svg className="h-6 w-6 text-blue-600 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Track course attendance and grades</span>
                        </li>
                        <li className="flex">
                          <svg className="h-6 w-6 text-blue-600 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Submit assignments online</span>
                        </li>
                        <li className="flex">
                          <svg className="h-6 w-6 text-blue-600 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>View course materials and schedule</span>
                        </li>
                      </ul>
                      <div className="mt-6">
                        <Link 
                          href="/register?role=student" 
                          className="inline-flex items-center text-blue-600 font-medium hover:text-blue-800"
                        >
                          Register as Student
                          <svg className="ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div 
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                  className="w-full md:w-1/2"
                >
                  <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200 relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-indigo-200 rounded-full opacity-20"></div>
                    <div className="relative">
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">For Faculty</h3>
                      <ul className="space-y-4">
                        <li className="flex">
                          <svg className="h-6 w-6 text-indigo-600 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Manage student attendance</span>
                        </li>
                        <li className="flex">
                          <svg className="h-6 w-6 text-indigo-600 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Grade assignments and track progress</span>
                        </li>
                        <li className="flex">
                          <svg className="h-6 w-6 text-indigo-600 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Manage course materials and resources</span>
                        </li>
                      </ul>
                      <div className="mt-6">
                        <Link 
                          href="/register?role=faculty" 
                          className="inline-flex items-center text-indigo-600 font-medium hover:text-indigo-800"
                        >
                          Register as Faculty
                          <svg className="ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>

        {/* Testimonials */}
        <div className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              <h2 className="text-base font-semibold text-blue-600 tracking-wide uppercase">Testimonials</h2>
              <p className="mt-1 text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight">
                Trusted by educators
              </p>
              <p className="max-w-xl mt-5 mx-auto text-xl text-gray-500">
                See what our users have to say about ScholarSync.
              </p>
            </motion.div>

            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  quote: "ScholarSync transformed how our department tracks attendance and grades.",
                  name: "Dr. Amelia Robinson",
                  title: "Department Head, Engineering",
                  delay: 0.2,
                  color: "bg-blue-50"
                },
                {
                  quote: "The student dashboard makes it so easy to track my progress and upcoming assignments.",
                  name: "Michael Chen",
                  title: "Computer Science Student",
                  delay: 0.4,
                  color: "bg-indigo-50"
                },
                {
                  quote: "As an administrator, I can finally get accurate real-time reports on attendance and academic performance.",
                  name: "Sarah Johnson",
                  title: "University Administrator",
                  delay: 0.6,
                  color: "bg-purple-50"
                }
              ].map((testimonial, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: testimonial.delay, duration: 0.8 }}
                  className={`${testimonial.color} p-6 rounded-lg shadow-md`}
                >
                  <svg className="h-12 w-12 text-blue-600 opacity-25 mb-4" fill="currentColor" viewBox="0 0 32 32">
                    <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
                  </svg>
                  <p className="text-gray-600 mb-4">{testimonial.quote}</p>
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-blue-200 flex items-center justify-center">
                      <span className="text-blue-800 font-bold">{testimonial.name[0]}</span>
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-gray-900">{testimonial.name}</h4>
                      <p className="text-xs text-gray-500">{testimonial.title}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-blue-600">
          <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="lg:w-0 lg:flex-1"
            >
              <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Ready to transform your educational institution?
              </h2>
              <p className="mt-4 max-w-3xl text-lg text-blue-100">
                Join thousands of educational institutions that have improved their efficiency and student experience with ScholarSync.
              </p>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="mt-8 flex lg:mt-0 lg:flex-shrink-0"
            >
              <div className="inline-flex rounded-md shadow">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50"
                >
                  Get started
                </Link>
              </div>
              <div className="ml-3 inline-flex rounded-md shadow">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-800 hover:bg-blue-700"
                >
                  Contact sales
                </Link>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-gray-800">
          <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="md:col-span-2">
                <h3 className="text-xl font-bold text-white">ScholarSync</h3>
                <p className="mt-4 text-gray-300 max-w-md">
                  Comprehensive education management system designed to streamline administrative tasks, enhance student engagement, and improve academic outcomes.
                </p>
                <div className="mt-6 flex space-x-6">
                  {/* Social icons */}
                  {['facebook', 'twitter', 'instagram', 'linkedin'].map((social) => (
                    <a key={social} href="#" className="text-gray-400 hover:text-white">
                      <span className="sr-only">{social}</span>
                      <div className="h-6 w-6">
                        {/* Icons would go here */}
                      </div>
                    </a>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-white tracking-wider uppercase">
                  Solutions
                </h3>
                <ul className="mt-4 space-y-4">
                  {['Student Management', 'Faculty Management', 'Course Management', 'Attendance Tracking', 'Grade Management'].map((item) => (
                    <li key={item}>
                      <a href="#" className="text-base text-gray-300 hover:text-white">
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-white tracking-wider uppercase">
                  Company
                </h3>
                <ul className="mt-4 space-y-4">
                  {['About Us', 'Contact', 'Careers', 'Blog', 'Privacy Policy', 'Terms of Service'].map((item) => (
                    <li key={item}>
                      <a href="#" className="text-base text-gray-300 hover:text-white">
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="mt-12 border-t border-gray-700 pt-8">
              <p className="text-base text-gray-400 text-center">
                &copy; {new Date().getFullYear()} ScholarSync. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // This shouldn't be reached due to redirects, but just in case
  return null;
}
