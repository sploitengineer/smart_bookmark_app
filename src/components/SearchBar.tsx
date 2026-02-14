"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface SearchBarProps {
    userId: string;
    onSearchResults: (results: Bookmark[] | null) => void;
}

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

export default function SearchBar({ userId, onSearchResults }: SearchBarProps) {
    const [query, setQuery] = useState("");
    const [searching, setSearching] = useState(false);
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState<"smart" | "tags">("smart");
    const supabase = createClient();

    // Simple tag-based search (instant, no AI)
    const searchByTags = async (searchQuery: string) => {
        const keywords = searchQuery.toLowerCase().split(/[\s,]+/).filter(Boolean);
        if (keywords.length === 0) {
            onSearchResults(null);
            return;
        }

        setSearching(true);

        // Search across title, url, summary, and tags using ilike
        const conditions = keywords.map((kw) =>
            `title.ilike.%${kw}%,url.ilike.%${kw}%,summary.ilike.%${kw}%`
        ).join(",");

        const { data } = await supabase
            .from("bookmarks")
            .select("*")
            .eq("user_id", userId)
            .or(conditions)
            .order("created_at", { ascending: false })
            .limit(20);

        // Also check tags array for matches
        if (data) {
            // Filter results that match tags too
            const tagMatches = data.filter(
                (b) => b.tags?.some((t: string) => keywords.some((kw) => t.toLowerCase().includes(kw)))
            );

            // Combine: prioritize tag matches, then other results
            const seen = new Set<string>();
            const combined: Bookmark[] = [];
            for (const bm of [...tagMatches, ...data]) {
                if (!seen.has(bm.id)) {
                    seen.add(bm.id);
                    combined.push(bm);
                }
            }
            onSearchResults(combined);
        } else {
            onSearchResults([]);
        }
        setSearching(false);
    };

    // AI-powered search
    const searchWithAI = async (searchQuery: string) => {
        setSearching(true);
        try {
            const res = await fetch("/api/ai/search", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: searchQuery.trim(), userId }),
            });
            const data = await res.json();
            onSearchResults(data.results || []);
        } catch {
            onSearchResults(null);
        }
        setSearching(false);
    };

    const handleSearch = () => {
        if (!query.trim()) {
            onSearchResults(null);
            return;
        }
        if (mode === "tags") {
            searchByTags(query);
        } else {
            searchWithAI(query);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") handleSearch();
        if (e.key === "Escape") { setQuery(""); onSearchResults(null); setIsActive(false); }
    };

    const handleClear = () => { setQuery(""); onSearchResults(null); setIsActive(false); };

    return (
        <div className="mb-5">
            <div
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all duration-300 bg-white ${isActive ? "border-[#FF6B6B]/30 shadow-md shadow-[#FF6B6B]/5" : "border-[#E8E8F0] hover:border-[#D0D0E0]"
                    }`}
            >
                {/* Search icon */}
                <svg className={`w-4 h-4 flex-shrink-0 transition-colors ${isActive ? "text-[#FF6B6B]" : "text-[#CDCDDD]"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>

                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setIsActive(true)}
                    onBlur={() => !query && setIsActive(false)}
                    placeholder={mode === "tags" ? "Search by tag or keyword..." : 'Search — "my react learning links"'}
                    className="flex-1 bg-transparent text-[#1A1A2E] text-sm placeholder-[#CDCDDD] focus:outline-none"
                />

                {/* Mode toggle */}
                <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                        type="button"
                        onClick={() => setMode("tags")}
                        className={`px-2 py-0.5 text-[0.6rem] font-semibold rounded-md transition-all cursor-pointer ${mode === "tags" ? "bg-[#FFF0EE] text-[#FF6B6B]" : "text-[#CDCDDD] hover:text-[#8888A0]"
                            }`}
                    >
                        Tags
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode("smart")}
                        className={`px-2 py-0.5 text-[0.6rem] font-semibold rounded-md transition-all cursor-pointer ${mode === "smart" ? "bg-[#E8F9F6] text-[#2EC4B6]" : "text-[#CDCDDD] hover:text-[#8888A0]"
                            }`}
                    >
                        AI
                    </button>
                </div>

                {query && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleClear}
                            className="p-1 text-[#CDCDDD] hover:text-[#8888A0] transition-colors cursor-pointer"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                        <button
                            onClick={handleSearch}
                            disabled={searching}
                            className="px-3 py-1 text-xs font-semibold bg-[#1A1A2E] text-white rounded-lg hover:bg-[#2A2A44] transition-all cursor-pointer disabled:opacity-50"
                        >
                            {searching ? "..." : "Go"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
