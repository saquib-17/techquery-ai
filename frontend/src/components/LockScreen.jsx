// src/components/LockScreen.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { Lock, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function LockScreen({ redirectTo = "/login", from = "/" }) {
  const nav = useNavigate();

  return (
    <div className="flex items-center justify-center py-12 ">
      <motion.div
        initial={{ scale: 0.98, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.35 }}
        className="max-w-md w-full  bg-white/80 dark:bg-slate-900/70 border border-gray-100 dark:border-slate-800 rounded-xl shadow-lg p-6 text-center backdrop-blur"
      >
        <div className="mx-auto w-20 h-20 rounded-full border shadow-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center mb-4">
          <Lock className="w-8 h-8 text-indigo-600 dark:text-indigo-300" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Login required</h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          You must be signed in to access this page. Sign in to continue.
        </p>

        <div className="mt-5 flex items-center justify-center gap-3">
          <button
            onClick={() => nav(redirectTo, { state: { from } })}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white cursor-pointer"
          >
            Go to Login <ArrowRight className="w-4 h-4" />
          </button>

          <button onClick={() => nav("/")} className="px-4 py-2 text-white cursor-pointer rounded-lg border">Back home</button>
        </div>
      </motion.div>
    </div>
  );
}
