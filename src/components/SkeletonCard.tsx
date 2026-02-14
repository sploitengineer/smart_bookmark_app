"use client";

export default function SkeletonCard() {
    return (
        <div className="bg-white rounded-2xl border border-[#E8E8F0] p-4 animate-pulse">
            <div className="flex items-stretch gap-4">
                {/* Left: text skeleton */}
                <div className="flex-1 space-y-2.5">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-sm shimmer-bg" />
                        <div className="h-3 w-20 rounded shimmer-bg" />
                    </div>
                    <div className="h-4 w-3/4 rounded shimmer-bg" />
                    <div className="h-3 w-full rounded shimmer-bg" />
                    <div className="flex gap-1.5 pt-1">
                        <div className="h-5 w-14 rounded-full shimmer-bg" />
                        <div className="h-5 w-12 rounded-full shimmer-bg" />
                        <div className="h-5 w-16 rounded-full shimmer-bg" />
                    </div>
                </div>
                {/* Right: thumbnail skeleton */}
                <div className="flex-shrink-0 w-24 h-20 rounded-xl shimmer-bg" />
            </div>
        </div>
    );
}
