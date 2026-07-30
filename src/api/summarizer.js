import * as cheerio from "cheerio";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    // Fetch page HTML
    const pageRes = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
    const html = await pageRes.text();

    // Extract readable text
    const $ = cheerio.load(html);
    $("script, style, nav, footer, header").remove();
    const text = $("body").text().replace(/\s+/g, " ").trim().slice(0, 8000);

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that summarizes web articles clearly and concisely.",
        },
        {
          role: "user",
          content: `Summarize the following page content:\n\n${text}`,
        },
      ],
    });

    const summary = completion.choices[0].message.content;
    res.status(200).json({ summary });
  } catch (err) {
    console.error("Summarize error:", err);
    res.status(500).json({ error: err.message || "Failed to summarize URL" });
  }
}
