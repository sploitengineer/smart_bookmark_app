"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { User } from "@supabase/supabase-js";

interface NavbarProps {
    user: User;
}

export default function Navbar({ user }: NavbarProps) {
    const router = useRouter();
    const supabase = createClient();

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
    };

    return (
        <nav className="border-b border-[#E8E8F0] bg-white/80 backdrop-blur-xl sticky top-0 z-50">
            <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
                {/* Logo */}
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-[#FF6B6B] to-[#FF8E8E] rounded-lg flex items-center justify-center shadow-sm shadow-[#FF6B6B]/15">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                    </div>
                    <span className="text-base font-bold text-[#1A1A2E] tracking-tight">
                        SmartMark
                    </span>
                    <span className="text-[0.55rem] px-1.5 py-0.5 rounded-md bg-[#E8F9F6] text-[#2EC4B6] font-bold tracking-wider uppercase">
                        AI
                    </span>
                </div>

                {/* User Info + Sign Out */}
                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center gap-2">
                        {user.user_metadata?.avatar_url && (
                            <img
                                src={user.user_metadata.avatar_url}
                                alt={user.user_metadata.full_name || "User"}
                                className="w-7 h-7 rounded-full ring-2 ring-[#FF6B6B]/15"
                            />
                        )}
                        <span className="text-xs text-[#8888A0] max-w-[120px] truncate font-medium">
                            {user.user_metadata?.full_name || user.email}
                        </span>
                    </div>
                    <button
                        onClick={handleSignOut}
                        className="px-3 py-1.5 text-xs text-[#8888A0] hover:text-[#FF6B6B] hover:bg-[#FFF0EE] rounded-lg transition-all duration-200 cursor-pointer font-medium"
                    >
                        Sign Out
                    </button>
                </div>
            </div>
        </nav>
    );
}
