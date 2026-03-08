import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search");
        const tab = searchParams.get("tab") || "my"; // "my" or "shared"

        let whereClause: any = {};

        if (tab === "shared") {
            // Show public articles not created by the user (or all public)
            whereClause = { isPublic: true };
        } else {
            // "my" articles
            whereClause = { userId: (session.user as any).id };
        }

        if (search) {
            whereClause.title = { contains: search };
        }

        const articles = await prisma.article.findMany({
            where: whereClause,
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                title: true,
                createdAt: true,
                userId: true,
                user: { select: { name: true, email: true } }
            },
        });

        return NextResponse.json(articles);
    } catch (error) {
        console.error("Error fetching articles:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { title, content, isPublic = true } = await req.json();

        if (!title || !content) {
            return NextResponse.json({ message: "Title and content are required" }, { status: 400 });
        }

        const article = await prisma.article.create({
            data: {
                title,
                content,
                isPublic,
                userId: (session.user as any).id
            },
        });

        return NextResponse.json(article, { status: 201 });
    } catch (error) {
        console.error("Error creating article:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
