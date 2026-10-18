import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function Toast({ message, type = 'success', onClose }) {
  // Support either plain string or object payload { text, type }
  const text = typeof message === 'object' && message !== null ? message.text : message;
  const toastType = (typeof message === 'object' && message !== null ? message.type : type) || 'success';

  useEffect(() => {
    if (!text) return;

    // Success auto-dismisses after 3s; error auto-dismisses after 5s
    const duration = toastType === 'error' ? 5000 : 3000;
    const timer = setTimeout(() => {
      if (onClose) {
        onClose();
      }
    }, duration);

    return () => {
      clearTimeout(timer);
    };
  }, [text, toastType, onClose]);

  if (!text) return null;

  const isSuccess = toastType === 'success';

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border border-purple-500/30 bg-[#0f0b1e]/90 text-white shadow-xl shadow-purple-950/40 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-3 duration-300">
      {isSuccess ? (
        <CheckCircle2 className="w-5 h-5 text-purple-400 shrink-0" />
      ) : (
        <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
      )}
      <p className="text-sm font-medium pr-2 text-[#FAFAFA]">{text}</p>
      <button
        type="button"
        onClick={onClose}
        className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        aria-label="Close notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
