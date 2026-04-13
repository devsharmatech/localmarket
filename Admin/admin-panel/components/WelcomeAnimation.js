'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function WelcomeAnimation({ onComplete }) {
       const letters = "ADMIN PANEL".split("");

       useEffect(() => {
              const timer = setTimeout(onComplete, 2200);
              return () => clearTimeout(timer);
       }, [onComplete]);

       return (
              <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0F172A] text-white overflow-hidden">
                     {/* Dynamic Background Particles */}
                     <div className="absolute inset-0 z-0">
                            {[...Array(12)].map((_, i) => (
                                   <motion.div
                                          key={i}
                                          className="absolute rounded-full bg-blue-500/10 blur-xl"
                                          style={{
                                                 width: Math.random() * 200 + 100,
                                                 height: Math.random() * 200 + 100,
                                                 left: `${Math.random() * 100}%`,
                                                 top: `${Math.random() * 100}%`,
                                          }}
                                          animate={{
                                                 x: [0, Math.random() * 100 - 50],
                                                 y: [0, Math.random() * 100 - 50],
                                                 scale: [1, 1.2, 1],
                                                 opacity: [0.05, 0.2, 0.05],
                                          }}
                                          transition={{
                                                 duration: Math.random() * 10 + 10,
                                                 repeat: Infinity,
                                                 ease: "linear",
                                          }}
                                   />
                            ))}
                     </div>

                     <div className="relative z-10 text-center px-6">
                            <AnimatePresence mode="wait">
                                   <motion.div
                                          initial={{ opacity: 0, scale: 0.8, y: 20 }}
                                          animate={{ opacity: 1, scale: 1, y: 0 }}
                                          exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
                                          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                                   >
                                          {/* Logo Icon */}
                                          <motion.div
                                                 initial={{ rotate: -10, scale: 0.5, opacity: 0 }}
                                                 animate={{ rotate: 0, scale: 1, opacity: 1 }}
                                                 transition={{ type: "spring", damping: 12, stiffness: 100, delay: 0.2 }}
                                                 className="w-24 h-24 bg-gradient-to-br from-orange-400 to-blue-600 rounded-3xl mx-auto flex items-center justify-center shadow-2xl mb-8 border border-white/20"
                                          >
                                                 <span className="text-4xl font-black italic">L</span>
                                          </motion.div>

                                          {/* Staggered Text */}
                                          <div className="flex justify-center mb-4 overflow-hidden py-2 flex-wrap gap-y-2">
                                                 {letters.map((char, i) => (
                                                        <motion.span
                                                               key={i}
                                                               initial={{ y: 50, opacity: 0 }}
                                                               animate={{ y: 0, opacity: 1 }}
                                                               transition={{
                                                                      duration: 0.5,
                                                                      ease: [0.22, 1, 0.36, 1],
                                                                      delay: 0.4 + i * 0.05,
                                                               }}
                                                               className={`text-4xl sm:text-5xl font-black tracking-tight inline-block ${char === " " ? "mx-4" : "mx-0.5"}`}
                                                        >
                                                               {char}
                                                        </motion.span>
                                                 ))}
                                          </div>

                                          <motion.div
                                                 initial={{ opacity: 0 }}
                                                 animate={{ opacity: 1 }}
                                                 transition={{ duration: 1, delay: 1.2 }}
                                          >
                                                 <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px]">
                                                        Ready to manage your market
                                                 </p>
                                          </motion.div>

                                          <div className="mt-12 w-40 h-[1px] bg-white/10 mx-auto rounded-full overflow-hidden">
                                                 <motion.div
                                                        className="h-full bg-gradient-to-r from-orange-400 to-blue-500"
                                                        initial={{ width: "0%" }}
                                                        animate={{ width: "100%" }}
                                                        transition={{ duration: 2, ease: "easeInOut" }}
                                                 />
                                          </div>
                                   </motion.div>
                            </AnimatePresence>
                     </div>
              </div>
       );
}
