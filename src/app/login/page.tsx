"use client";

import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginContent() {
    const searchParams = useSearchParams();
    const error = searchParams.get("error");
    const supabase = createClient();

    const handleGoogleLogin = async () => {
        await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, #E0F7F1 0%, #FFF5EE 30%, #FCE4EC 60%, #E8EAF6 100%)" }}
        >
            {/* Floating decorative shapes */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[10%] left-[5%] w-20 h-20 rounded-full bg-[#FF6B6B]/15 animate-float" />
                <div className="absolute top-[60%] left-[12%] w-32 h-32 rounded-full bg-[#2EC4B6]/12 animate-float-delayed" />
                <div className="absolute top-[20%] right-[8%] w-24 h-24 rounded-full bg-[#C3B1E1]/20 animate-float-delayed" />
                <div className="absolute bottom-[15%] right-[15%] w-16 h-16 rounded-full bg-[#FFB5A7]/25 animate-float" />
                <div className="absolute top-[45%] left-[30%] w-12 h-12 rounded-full bg-[#B8F3E6]/30 animate-float" />

                {/* Floating bookmark icons */}
                <div className="absolute top-[18%] left-[18%] animate-float opacity-10">
                    <svg className="w-10 h-10 text-[#FF6B6B]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                </div>
                <div className="absolute top-[65%] right-[10%] animate-float-delayed opacity-10">
                    <svg className="w-8 h-8 text-[#2EC4B6]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                </div>
                <div className="absolute bottom-[30%] left-[8%] animate-float opacity-8">
                    <svg className="w-9 h-9 text-[#C3B1E1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                </div>
            </div>

            {/* Card */}
            <div className="relative w-full max-w-sm mx-4 animate-slide-up">
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-xl shadow-black/5 border border-white/60">
                    {/* Logo */}
                    <div className="flex justify-center mb-5">
                        <div className="w-14 h-14 bg-gradient-to-br from-[#FF6B6B] to-[#FF8E8E] rounded-2xl flex items-center justify-center shadow-lg shadow-[#FF6B6B]/20">
                            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                            </svg>
                        </div>
                    </div>

                    {/* Title */}
                    <h1 className="text-2xl font-bold text-center text-[#1A1A2E] mb-1">
                        SmartMark
                    </h1>
                    <p className="text-center text-[#8888A0] text-xs mb-1">
                        AI-Powered Bookmark Manager
                    </p>
                    <p className="text-center text-[#ABABBE] text-[0.65rem] mb-8">
                        Save links. AI handles the rest.
                    </p>

                    {/* Error */}
                    {error && (
                        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl text-red-500 text-sm text-center">
                            Authentication failed. Please try again.
                        </div>
                    )}

                    {/* Google Sign-In Button */}
                    <button
                        onClick={handleGoogleLogin}
                        className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-[#1A1A2E] hover:bg-[#2A2A44] text-white font-medium text-sm rounded-xl transition-all duration-300 hover:shadow-lg cursor-pointer active:scale-[0.97] hover:scale-[1.01]"
                    >
                        <svg className="w-4.5 h-4.5" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        Continue with Google
                    </button>

                    {/* Feature pills */}
                    <div className="mt-8 pt-6 border-t border-[#E8E8F0]">
                        <div className="flex flex-wrap justify-center gap-2">
                            <span className="tag-pill tag-coral">🤖 AI Tags</span>
                            <span className="tag-pill tag-teal">⚡ Real-time</span>
                            <span className="tag-pill tag-lavender">🔒 Private</span>
                            <span className="tag-pill tag-peach">🔍 Smart Search</span>
                        </div>
                    </div>
                </div>

                {/* Bottom badge */}
                <div className="text-center mt-4">
                    <span className="text-[0.6rem] text-[#ABABBE]">
                        Powered by Supabase • Groq AI
                    </span>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #E0F7F1 0%, #FFF5EE 50%, #E8EAF6 100%)" }}>
                    <div className="animate-spin w-8 h-8 border-2 border-[#FF6B6B] border-t-transparent rounded-full" />
                </div>
            }
        >
            <LoginContent />
        </Suspense>
    );
}
