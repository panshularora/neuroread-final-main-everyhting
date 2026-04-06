import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function LearningModal({ open, onClose, title, children }) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      const onKeyDown = (e) => {
        if (e.key === 'Escape') onClose();
      };
      document.addEventListener('keydown', onKeyDown);
      return () => {
        document.body.style.overflow = '';
        document.removeEventListener('keydown', onKeyDown);
      };
    }
  }, [open, onClose]);

  if (!open) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 md:p-6 bg-black/70 backdrop-blur-md animate-in fade-in duration-300"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#f2f0e9] w-full max-w-4xl max-h-[90vh] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
        <div className="px-8 py-6 border-b border-charcoal/5 flex items-center justify-between shrink-0 bg-white/50">
          <h2 className="text-2xl font-medium tracking-tight text-charcoal">{title}</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-charcoal/5 transition-colors group"
          >
            <span className="iconify text-2xl text-charcoal/40 group-hover:text-charcoal" data-icon="solar:close-circle-linear" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
