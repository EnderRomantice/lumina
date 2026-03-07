import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const word = searchParams.get("word");

        if (!word) {
            return NextResponse.json({ message: "Word query param is required" }, { status: 400 });
        }

        // Use Free Dictionary API
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);

        if (!response.ok) {
            if (response.status === 404) {
                return NextResponse.json({ translation: "Definition not found" }, { status: 404 });
            }
            return NextResponse.json({ message: "Dictionary API error" }, { status: response.status });
        }

        const data = await response.json();

        // Extract a simple meaning/translation. Assuming english to english definition acts as translation.
        // If we wanted Chinese translation, we'd need Google Translate or similar. For now, we take the first definition.
        let translation = "No definition found";
        try {
            translation = data[0].meanings[0].definitions[0].definition;
        } catch (e) {
            console.error("Failed to parse definition:", e);
        }

        return NextResponse.json({ translation });
    } catch (error) {
        console.error("Error fetching translation:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
