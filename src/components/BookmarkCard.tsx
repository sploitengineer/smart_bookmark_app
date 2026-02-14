"use client";

import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

const TAG_COLORS = ["tag-coral", "tag-teal", "tag-lavender", "tag-peach", "tag-mint"];

interface BookmarkCardProps {
    bookmark: {
        id: string;
        title: string;
        url: string;
        created_at: string;
        summary?: string;
        tags?: string[];
        og_image?: string;
    };
}

export default function BookmarkCard({ bookmark }: BookmarkCardProps) {
    const supabase = createClient();
    const [deleting, setDeleting] = useState(false);
    const [imgError, setImgError] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    const handleDelete = async () => {
        setDeleting(true);
        await supabase.from("bookmarks").delete().eq("id", bookmark.id);
    };

    // Validate that something looks like a real domain (must contain a dot)
    const isValidDomain = (d: string) => d.includes(".") && !d.includes(" ");

    // Regex-based domain extraction — consistent server & client
    const getDomain = (url: string) => {
        try {
            const match = url.match(/^https?:\/\/(?:www\.)?([^\/\s:]+)/i);
            if (match && isValidDomain(match[1])) return match[1];
            return "";
        } catch {
            return "";
        }
    };

    const domain = getDomain(bookmark.url);
    const faviconUrl = domain
        ? `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
        : null;

    // Only show thumbnail if we have an actual OG image from AI enrichment
    const hasThumbnail = bookmark.og_image && !imgError;

    const timeAgo = (dateStr: string) => {
        const diff = Date.now() - new Date(dateStr).getTime();
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return "just now";
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        if (days < 30) return `${days}d ago`;
        return new Date(dateStr).toLocaleDateString();
    };

    const isAiLoading = !bookmark.summary && !bookmark.tags?.length;

    // Generate a color from the title for the placeholder
    const placeholderColor = () => {
        const colors = ["#FF6B6B", "#2EC4B6", "#C3B1E1", "#FFB5A7", "#B8F3E6"];
        const index = bookmark.title.charCodeAt(0) % colors.length;
        return colors[index];
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: deleting ? 0.3 : 1, y: 0, scale: deleting ? 0.97 : 1 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="group relative bg-white rounded-2xl border border-[#E8E8F0] hover:border-[#D0D0E0] hover:shadow-md transition-all duration-300 overflow-hidden"
        >
            <a
                href={bookmark.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-stretch p-4 gap-4"
            >
                {/* Left: Text content */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                        {/* TITLE — user's name, big and bold */}
                        <h3 className="text-[#1A1A2E] font-semibold text-[0.95rem] leading-snug line-clamp-2 group-hover:text-[#FF6B6B] transition-colors">
                            {bookmark.title}
                        </h3>

                        {/* Domain — small and subtle */}
                        <div className="flex items-center gap-1.5 mt-1">
                            {mounted && faviconUrl && (
                                <img
                                    src={faviconUrl}
                                    alt=""
                                    className="w-3.5 h-3.5 rounded-sm flex-shrink-0"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                                />
                            )}
                            {domain && (
                                <span className="text-[0.65rem] text-[#ABABBE] truncate max-w-[280px]">
                                    {domain}
                                </span>
                            )}
                        </div>

                        {/* AI Summary */}
                        {bookmark.summary ? (
                            <p className="text-xs text-[#8888A0] mt-1.5 leading-relaxed line-clamp-2">
                                {bookmark.summary}
                            </p>
                        ) : isAiLoading ? (
                            <div className="flex items-center gap-2 mt-1.5">
                                <span className="text-[0.6rem] text-[#ABABBE]">AI analyzing</span>
                                <span className="ai-dots">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </span>
                            </div>
                        ) : null}
                    </div>

                    {/* Bottom: Tags + time */}
                    <div className="flex items-center gap-2 mt-2.5">
                        {bookmark.tags && bookmark.tags.length > 0 && (
                            <div className="flex gap-1 flex-wrap">
                                {bookmark.tags.slice(0, 3).map((tag, i) => (
                                    <span key={tag} className={`tag-pill ${TAG_COLORS[i % TAG_COLORS.length]}`}>
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}
                        <span className="text-[0.6rem] text-[#CDCDDD] ml-auto whitespace-nowrap" suppressHydrationWarning>
                            {mounted ? timeAgo(bookmark.created_at) : ""}
                        </span>
                    </div>
                </div>

                {/* Right: Thumbnail or colored placeholder */}
                <div className="flex-shrink-0 w-[88px] h-[68px] rounded-xl overflow-hidden border border-[#E8E8F0]">
                    {hasThumbnail ? (
                        <img
                            src={bookmark.og_image}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={() => setImgError(true)}
                        />
                    ) : (
                        <div
                            className="w-full h-full flex items-center justify-center"
                            style={{ background: `${placeholderColor()}15` }}
                        >
                            <svg className="w-5 h-5" style={{ color: `${placeholderColor()}60` }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                        </div>
                    )}
                </div>
            </a>

            {/* Delete button - shows on hover */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(); }}
                    disabled={deleting}
                    className="p-1.5 bg-white/90 hover:bg-red-50 text-[#CDCDDD] hover:text-red-400 rounded-lg shadow-sm border border-[#E8E8F0] transition-all cursor-pointer disabled:cursor-not-allowed"
                    title="Delete"
                >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </motion.div>
    );
}
