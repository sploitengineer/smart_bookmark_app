"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState, useCallback, useMemo } from "react";
import { AnimatePresence } from "framer-motion";
import BookmarkCard from "./BookmarkCard";
import AddBookmarkForm from "./AddBookmarkForm";
import SearchBar from "./SearchBar";
import SkeletonCard from "./SkeletonCard";

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

interface BookmarkListProps {
    initialBookmarks: Bookmark[];
    userId: string;
}

export default function BookmarkList({ initialBookmarks, userId }: BookmarkListProps) {
    const [bookmarks, setBookmarks] = useState<Bookmark[]>(initialBookmarks);
    const [searchResults, setSearchResults] = useState<Bookmark[] | null>(null);
    const supabase = useMemo(() => createClient(), []);

    const displayBookmarks = searchResults !== null ? searchResults : bookmarks;

    const handleBookmarkAdded = useCallback((newBookmark: Bookmark) => {
        setBookmarks((prev) => {
            if (prev.find((b) => b.id === newBookmark.id)) return prev;
            return [newBookmark, ...prev];
        });
    }, []);

    // When AI enrichment finishes, update the bookmark in-place
    const handleBookmarkUpdated = useCallback((updated: Bookmark) => {
        setBookmarks((prev) =>
            prev.map((b) => (b.id === updated.id ? updated : b))
        );
    }, []);

    const handleSearchResults = useCallback((results: Bookmark[] | null) => {
        setSearchResults(results);
    }, []);

    useEffect(() => {
        const channel = supabase
            .channel("bookmarks-realtime")
            .on(
                "postgres_changes",
                { event: "*", schema: "public" },
                (payload: any) => {
                    // Filter for bookmarks table (case-insensitive check to be safe)
                    if (payload.table !== "bookmarks" && payload.table !== "Bookmarks") return;

                    if (payload.eventType === "INSERT") {
                        const newBookmark = payload.new as Bookmark;
                        if (!newBookmark.id) return;

                        setBookmarks((prev) => {
                            if (prev.find((b) => b.id === newBookmark.id)) return prev;
                            return [newBookmark, ...prev];
                        });
                    } else if (payload.eventType === "UPDATE") {
                        const updated = payload.new as Bookmark;
                        if (!updated.id) return;

                        setBookmarks((prev) => {
                            const exists = prev.find((b) => b.id === updated.id);
                            if (exists) {
                                return prev.map((b) => (b.id === updated.id ? { ...b, ...updated } : b));
                            } else {
                                // If bookmark doesn't exist (e.g. initial INSERT was missed), treat UPDATE as INSERT
                                // This works because we enabled REPLICA IDENTITY FULL
                                return [updated, ...prev];
                            }
                        });
                    } else if (payload.eventType === "DELETE") {
                        const deletedId = payload.old.id;
                        setBookmarks((prev) => prev.filter((b) => b.id !== deletedId));
                        setSearchResults((prev) => prev ? prev.filter((b) => b.id !== deletedId) : null);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [supabase, userId]);

    return (
        <>
            <AddBookmarkForm onBookmarkAdded={handleBookmarkAdded} onBookmarkUpdated={handleBookmarkUpdated} />
            <SearchBar userId={userId} onSearchResults={handleSearchResults} />

            {/* Stats */}
            <div className="flex items-center justify-between mb-4">
                <p className="text-[#8888A0] text-xs font-semibold tracking-wide uppercase">
                    {searchResults !== null ? (
                        <span className="text-[#FF6B6B]">
                            {displayBookmarks.length} result{displayBookmarks.length !== 1 ? "s" : ""}
                        </span>
                    ) : (
                        <>{bookmarks.length} bookmark{bookmarks.length !== 1 ? "s" : ""}</>
                    )}
                </p>
                {searchResults !== null && (
                    <button
                        onClick={() => setSearchResults(null)}
                        className="text-xs text-[#FF6B6B] hover:underline cursor-pointer"
                    >
                        Clear search
                    </button>
                )}
            </div>

            {/* List */}
            {displayBookmarks.length === 0 ? (
                <div className="text-center py-16">
                    <div className="w-16 h-16 mx-auto mb-4 bg-[#FFF0EE] rounded-2xl flex items-center justify-center animate-float">
                        <svg className="w-8 h-8 text-[#FF6B6B]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                    </div>
                    <h3 className="text-base font-semibold text-[#1A1A2E] mb-1">
                        {searchResults !== null ? "No matches found" : "No bookmarks yet"}
                    </h3>
                    <p className="text-[#8888A0] text-xs max-w-[260px] mx-auto">
                        {searchResults !== null
                            ? "Try a different search query"
                            : "Save your first link above — AI will auto-tag it!"}
                    </p>
                </div>
            ) : (
                <div className="space-y-2.5">
                    <AnimatePresence mode="popLayout">
                        {displayBookmarks.map((bookmark) => (
                            <BookmarkCard key={bookmark.id} bookmark={bookmark} />
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </>
    );
}
