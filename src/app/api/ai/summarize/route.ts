import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
    try {
        const { url } = await req.json();

        if (!url) {
            return NextResponse.json({ error: "URL is required" }, { status: 400 });
        }

        // Step 1: Fetch metadata from Microlink with 3s timeout
        let metadata: { title?: string; description?: string; image?: string } = {};
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 3000);

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
            // Microlink timed out or failed — continue with Groq using URL only
        }

        // Step 2: Ask Groq for summary + tags
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
                {
                    role: "system",
                    content: "You are a URL analyzer. Return only valid JSON, no markdown fences, no explanation.",
                },
                { role: "user", content: prompt },
            ],
            temperature: 0.1,
            max_tokens: 200,
        });

        const raw = completion.choices[0]?.message?.content?.trim() || "{}";

        // Parse the JSON (handle potential markdown fencing)
        let parsed;
        try {
            const cleaned = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
            parsed = JSON.parse(cleaned);
        } catch {
            parsed = { summary: metadata.description?.slice(0, 80) || "", tags: [], category: "Other" };
        }

        return NextResponse.json({
            summary: parsed.summary || "",
            tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 4) : [],
            category: parsed.category || "Other",
            og_image: metadata.image || "",
            title: metadata.title || "",
        });
    } catch (error) {
        console.error("AI summarize error:", error);
        return NextResponse.json(
            { error: "Failed to analyze URL" },
            { status: 500 }
        );
    }
}
