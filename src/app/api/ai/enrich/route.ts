import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Use service-role client to bypass RLS for background AI enrichment
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Try to get a thumbnail image URL from various sources
async function getThumbnailUrl(url: string, microlinkImage?: string): Promise<string> {
    // 1. Use OG image from Microlink if we got one
    if (microlinkImage) return microlinkImage;

    // 2. Try Google PageSpeed Insights (returns a base64 screenshot, but we need a URL)
    //    Instead, use Google's cache/thumbnail service
    try {
        // Google Favicon as a tiny fallback — not ideal for thumbnails
        // Try fetching Open Graph image directly from the page HTML
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);

        const pageRes = await fetch(url, {
            signal: controller.signal,
            headers: { "User-Agent": "Mozilla/5.0 (compatible; SmartMarkBot/1.0)" },
        });
        clearTimeout(timeout);

        const html = await pageRes.text();

        // Extract og:image from HTML
        const ogMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
            || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);

        if (ogMatch && ogMatch[1]) {
            // Make relative URLs absolute
            let imgUrl = ogMatch[1];
            if (imgUrl.startsWith("//")) imgUrl = "https:" + imgUrl;
            else if (imgUrl.startsWith("/")) {
                const parsed = new URL(url);
                imgUrl = parsed.origin + imgUrl;
            }
            return imgUrl;
        }

        // Try twitter:image as fallback
        const twMatch = html.match(/<meta[^>]*(?:name|property)=["']twitter:image["'][^>]*content=["']([^"']+)["']/i)
            || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*(?:name|property)=["']twitter:image["']/i);

        if (twMatch && twMatch[1]) {
            let imgUrl = twMatch[1];
            if (imgUrl.startsWith("//")) imgUrl = "https:" + imgUrl;
            else if (imgUrl.startsWith("/")) {
                const parsed = new URL(url);
                imgUrl = parsed.origin + imgUrl;
            }
            return imgUrl;
        }
    } catch {
        // Page fetch failed — no thumbnail
    }

    return "";
}

export async function POST(req: NextRequest) {
    try {
        const { bookmarkId, url } = await req.json();

        if (!bookmarkId || !url) {
            return NextResponse.json({ error: "bookmarkId and url are required" }, { status: 400 });
        }

        // Step 1: Fetch metadata from Microlink with 5s timeout
        let metadata: { title?: string; description?: string; image?: string } = {};
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000);

            const mlRes = await fetch(
                `https://api.microlink.io/?url=${encodeURIComponent(url)}`,
                { signal: controller.signal }
            );
            clearTimeout(timeout);

            const mlData = await mlRes.json();
            if (mlData.status === "success" && mlData.data) {
                metadata = {
                    title: mlData.data.title || "",
                    description: mlData.data.description || "",
                    image: mlData.data.image?.url || mlData.data.logo?.url || "",
                };
            }
        } catch {
            // Microlink timed out or failed — continue
        }

        // Step 2: Get thumbnail (OG image from Microlink, or direct page scrape)
        const thumbnailUrl = await getThumbnailUrl(url, metadata.image || "");

        // Step 3: Groq for summary + tags
        const prompt = `Analyze this web URL and its metadata. Return a JSON object only, no other text.

URL: ${url}
Title: ${metadata.title || "Unknown"}
Description: ${metadata.description || "No description available"}

Return EXACTLY this JSON format:
{
  "summary": "A concise 1-line summary (max 15 words) of what this page is about",
  "tags": ["tag1", "tag2", "tag3"],
  "category": "One of: Development, AI/ML, Design, Business, News, Education, Entertainment, Social, Tools, Other"
}

Rules:
- summary should be informative and specific, not generic
- tags should be 2-4 lowercase single words
- Pick the most fitting category`;

        const completion = await groq.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: [
                { role: "system", content: "You are a URL analyzer. Return only valid JSON, no markdown fences, no explanation." },
                { role: "user", content: prompt },
            ],
            temperature: 0.1,
            max_tokens: 200,
        });

        const raw = completion.choices[0]?.message?.content?.trim() || "{}";
        let parsed;
        try {
            const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
            parsed = JSON.parse(cleaned);
        } catch {
            parsed = { summary: metadata.description?.slice(0, 80) || "", tags: [], category: "Other" };
        }

        // Step 4: Update the bookmark with AI data + thumbnail
        const { data: updated, error: updateError } = await supabase
            .from("bookmarks")
            .update({
                summary: parsed.summary || null,
                tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 4) : [],
                og_image: thumbnailUrl || null,
            })
            .eq("id", bookmarkId)
            .select()
            .single();

        if (updateError) {
            console.error("Supabase update error:", updateError);
            return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        return NextResponse.json({ bookmark: updated });
    } catch (error) {
        console.error("AI enrich error:", error);
        return NextResponse.json({ error: "Failed to enrich bookmark" }, { status: 500 });
    }
}
