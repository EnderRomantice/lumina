import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!(session?.user as any)?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search");
        const tag = searchParams.get("tag");

        let whereClause: any = { userId: (session!.user as any).id };

        if (search) {
            whereClause.OR = [
                { word: { contains: search } },
                { translation: { contains: search } }
            ];
        }

        if (tag) {
            whereClause.tags = { contains: tag };
        }

        const words = await prisma.word.findMany({
            where: whereClause,
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(words);
    } catch (error) {
        console.error("Error fetching words:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!(session?.user as any)?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { word, translation, tags } = await req.json();

        if (!word || !translation) {
            return NextResponse.json({ message: "Word and translation are required" }, { status: 400 });
        }

        const savedWord = await prisma.word.create({
            data: {
                word,
                translation,
                tags,
                userId: (session!.user as any).id,
            },
        });

        return NextResponse.json(savedWord, { status: 201 });
    } catch (error: any) {
        console.error("Error saving word:", error);
        if (error.code === "P2002") {
            return NextResponse.json({ message: "Word already in bank" }, { status: 409 });
        }
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
