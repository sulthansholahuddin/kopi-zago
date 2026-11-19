import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { MessageSquare, X } from "lucide-react";
import { useAuth } from "@/lib/auth";

export function ChatBubble() {
  const [open, setOpen] = useState(false);
  const { session } = useAuth();
  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 overflow-hidden rounded-2xl bg-card shadow-lift">
          <div className="flex items-center justify-between bg-primary px-5 py-4 text-primary-foreground">
            <h3 className="text-base">Chat Support</h3>
            <button onClick={() => setOpen(false)} aria-label="Tutup chat">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="space-y-4 p-5 text-sm text-muted-foreground">
            {session ? (
              <p>Halo! Tim Jago siap membantu. Ceritakan kendalamu lewat halaman pesanan, dan kami akan segera menghubungimu.</p>
            ) : (
              <>
                <p>Log in to save your chat and continue on any device.</p>
                <Link
                  to="/login"
                  className="jago-label block rounded-full bg-primary py-3 text-center text-xs text-primary-foreground hover:bg-primary-dark"
                >
                  Login
                </Link>
              </>
            )}
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Chat support"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-red transition-transform hover:scale-105"
      >
        <MessageSquare className="h-6 w-6" />
      </button>
    </>
  );
}
