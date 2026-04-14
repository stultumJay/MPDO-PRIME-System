import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock } from 'lucide-react';
import logo from '../assets/mpdo-logo.jpg';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white p-10 rounded-3xl shadow-2xl border border-slate-100 overflow-hidden"
          >
            <div className="flex flex-col items-center mb-8 text-center">
              <img src={logo} alt="MPDO Logo" className="w-20 h-20 mb-4 object-contain" />
              <h3 className="text-2xl font-bold tracking-tight text-slate-900">System Login</h3>
              <p className="text-slate-500 text-sm mt-1">Authorized MPDO Personnel Only</p>
            </div>

            <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-slate-50 rounded-full text-slate-400">
              <X className="w-5 h-5" />
            </button>

            <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Username</label>
                <input type="text" className="input-field" placeholder="Enter username" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Password</label>
                <input type="password" className="input-field" placeholder="••••••••" />
              </div>
              <button className="w-full py-4 bg-accent text-white font-bold rounded-lg hover:bg-accent/90 transition-all">
                Sign In
              </button>
            </form>
            
            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
              <p className="text-slate-400 text-[10px] leading-relaxed uppercase tracking-tighter">
                This is a secure government system. <br />
                Unauthorized access is strictly prohibited.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}