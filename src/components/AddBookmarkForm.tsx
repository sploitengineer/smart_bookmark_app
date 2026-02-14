"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

interface Bookmark {
    id: string;
    user_id: string;
    title: string;
    url: string;
    created_at: string;
    summary?: string;
    tags?: string[];
    og_image?: string;
}

interface AddBookmarkFormProps {
    onBookmarkAdded: (bookmark: Bookmark) => void;
    onBookmarkUpdated: (bookmark: Bookmark) => void;
}

export default function AddBookmarkForm({ onBookmarkAdded, onBookmarkUpdated }: AddBookmarkFormProps) {
    const supabase = createClient();
    const [title, setTitle] = useState("");
    const [url, setUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!title.trim() || !url.trim()) {
            setError("Both title and URL are required.");
            return;
        }

        let finalUrl = url.trim();
        if (!/^https?:\/\//i.test(finalUrl)) finalUrl = "https://" + finalUrl;

        setLoading(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setError("You must be logged in.");
            setLoading(false);
            return;
        }

        // Save immediately with user's title
        const { data, error: insertError } = await supabase
            .from("bookmarks")
            .insert({
                title: title.trim(),
                url: finalUrl,
                user_id: user.id,
            })
            .select()
            .single();

        if (insertError) {
            setError(insertError.message);
            setLoading(false);
            return;
        }

        if (data) {
            onBookmarkAdded(data as Bookmark);
            setTitle("");
            setUrl("");
            setLoading(false);

            // AI enrichment in background (non-blocking)
            enrichWithAI(data.id, finalUrl);
        }
    };

    const enrichWithAI = async (bookmarkId: string, bookmarkUrl: string) => {
        try {
            const res = await fetch("/api/ai/enrich", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ bookmarkId, url: bookmarkUrl }),
            });
            const data = await res.json();

            if (data.bookmark) {
                onBookmarkUpdated(data.bookmark as Bookmark);
            }
        } catch {
            // AI enrichment is best-effort — bookmark is already saved
        }
    };

    return (
        <form onSubmit={handleSubmit} className="mb-6 bg-white rounded-2xl p-5 shadow-sm border border-[#E8E8F0]">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 bg-gradient-to-br from-[#FF6B6B] to-[#FF8E8E] rounded-lg flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
                    </svg>
                </div>
                <h2 className="text-sm font-bold text-[#1A1A2E]">Add Bookmark</h2>
            </div>

            {/* Error */}
            {error && (
                <div className="mb-3 p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-500 text-xs">
                    {error}
                </div>
            )}

            {/* Inputs — Title FIRST (it's the primary info), URL second */}
            <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                    type="text"
                    placeholder="Give it a name..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="flex-1 px-4 py-2.5 bg-[#F5F5FA] border border-[#E8E8F0] rounded-xl text-[#1A1A2E] text-sm placeholder-[#ABABBE] focus:outline-none focus:ring-2 focus:ring-[#FF6B6B]/30 focus:border-[#FF6B6B]/40 transition-all"
                />
                <input
                    type="text"
                    placeholder="Paste URL here..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="flex-1 px-4 py-2.5 bg-[#F5F5FA] border border-[#E8E8F0] rounded-xl text-[#1A1A2E] text-sm placeholder-[#ABABBE] focus:outline-none focus:ring-2 focus:ring-[#FF6B6B]/30 focus:border-[#FF6B6B]/40 transition-all"
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2.5 bg-[#1A1A2E] hover:bg-[#2A2A44] text-white text-sm font-semibold rounded-xl transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.97] whitespace-nowrap"
                >
                    {loading ? (
                        <span className="flex items-center gap-2">
                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Saving
                        </span>
                    ) : "Save"}
                </button>
            </div>

            <p className="text-[0.6rem] text-[#ABABBE] mt-2.5 ml-1">
                🤖 AI will auto-generate tags & summary after saving
            </p>
        </form>
    );
}
