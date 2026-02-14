import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BookmarkList from "@/components/BookmarkList";
import Navbar from "@/components/Navbar";

export default async function BookmarksPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const { data: bookmarks } = await supabase
        .from("bookmarks")
        .select("*")
        .order("created_at", { ascending: false });

    return (
        <div className="min-h-screen bg-[#FAFAF7]">
            <Navbar user={user} />
            <main className="max-w-3xl mx-auto px-4 py-6">
                {/* Header */}
                <div className="mb-5">
                    <h1 className="text-xl font-bold text-[#1A1A2E]">
                        Your Bookmarks
                    </h1>
                    <p className="text-[0.7rem] text-[#ABABBE] mt-0.5">
                        AI-powered tags & summaries • Real-time sync
                    </p>
                </div>

                <BookmarkList initialBookmarks={bookmarks || []} userId={user.id} />
            </main>
        </div>
    );
}
