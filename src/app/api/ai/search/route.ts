import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { createClient } from "@supabase/supabase-js";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
    try {
        const { query, userId } = await req.json();

        if (!query || !userId) {
            return NextResponse.json(
                { error: "Query and userId are required" },
                { status: 400 }
            );
        }

        // Ask Groq to parse the natural language query into search terms
        const prompt = `The user wants to search their bookmarks collection. Convert their natural language query into search keywords.

User query: "${query}"

Return EXACTLY this JSON format, nothing else:
{
  "keywords": ["keyword1", "keyword2"],
  "tags": ["tag1", "tag2"]
}

Rules:
- keywords: main search terms to match against bookmark titles, URLs, and summaries
- tags: relevant category/tag terms the bookmarks might have
- Keep both arrays short (1-3 items each)
- Lowercase everything`;

        const completion = await groq.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: [
                {
                    role: "system",
                    content: "You are a search query parser. Return only valid JSON, no markdown, no explanation.",
                },
                { role: "user", content: prompt },
            ],
            temperature: 0.1,
            max_tokens: 100,
        });

        const raw = completion.choices[0]?.message?.content?.trim() || "{}";
        let parsed;
        try {
            const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
            parsed = JSON.parse(cleaned);
        } catch {
            parsed = { keywords: [query.toLowerCase()], tags: [] };
        }

        const keywords: string[] = parsed.keywords || [query.toLowerCase()];
        const tags: string[] = parsed.tags || [];

        // Query Supabase using service-level access with the user's ID filter
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // Build OR conditions for keyword search across title, url, summary
        const searchConditions = keywords
            .map((k) => `title.ilike.%${k}%,url.ilike.%${k}%,summary.ilike.%${k}%`)
            .join(",");

        const { data: bookmarks, error } = await supabase
            .from("bookmarks")
            .select("*")
            .eq("user_id", userId)
            .or(searchConditions)
            .order("created_at", { ascending: false })
            .limit(20);

        if (error) {
            console.error("Search query error:", error);
            return NextResponse.json(
                { error: "Search failed" },
                { status: 500 }
            );
        }

        // If we also have tags, do a secondary filter
        let results = bookmarks || [];
        if (tags.length > 0 && results.length === 0) {
            // Fallback: search by tags
            const tagConditions = tags
                .map((t) => `tags.cs.{${t}}`)
                .join(",");

            const { data: tagResults } = await supabase
                .from("bookmarks")
                .select("*")
                .eq("user_id", userId)
                .or(tagConditions)
                .order("created_at", { ascending: false })
                .limit(20);

            results = tagResults || [];
        }

        return NextResponse.json({
            results,
            parsed: { keywords, tags },
        });
    } catch (error) {
        console.error("AI search error:", error);
        return NextResponse.json(
            { error: "Search failed" },
            { status: 500 }
        );
    }
}
