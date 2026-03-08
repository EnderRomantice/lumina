import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!(session?.user as any)?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const word = searchParams.get("word");

        if (!word) {
            return NextResponse.json({ message: "Word query param is required" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id: (session!.user as any).id },
            select: { language: true }
        });

        const lang = user?.language || "zh";

        let phonetic = "";
        let meanings: any[] = [];
        let localTranslation = "";

        // 1. ALWAYS fetch detailed English definitions and parts of speech
        try {
            const dictRes = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
            if (dictRes.ok) {
                const data = await dictRes.json();
                phonetic = data[0].phonetic || (data[0].phonetics?.find((p: any) => p.text)?.text) || "";
                meanings = data[0].meanings.map((m: any) => ({
                    partOfSpeech: m.partOfSpeech,
                    definitions: m.definitions.slice(0, 2).map((d: any) => d.definition)
                }));
            }
        } catch (e) {
            console.error("Dict API Error", e);
        }

        // 2. Fetch Translation if needed
        if (lang !== "en") {
            const myMemoryLangPair = lang === "zh-TW" ? "en|zh-TW" : "en|zh";
            try {
                const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=${myMemoryLangPair}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.responseData?.translatedText) {
                        localTranslation = data.responseData.translatedText;
                    }
                }
            } catch (e) {
                console.error("Translation API Error", e);
            }
        } else if (meanings.length > 0) {
            // For English-only mode, the translation is just the main definition
            localTranslation = meanings[0].definitions[0];
        }

        return NextResponse.json({
            translation: localTranslation || "No translation found",
            phonetic,
            meanings
        });
    } catch (error) {
        console.error("Error fetching translation:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
