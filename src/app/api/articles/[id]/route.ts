import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(
    req: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params;
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const article = await prisma.article.findUnique({
            where: { id: params.id },
            include: { user: { select: { id: true, name: true, email: true } } }
        });

        if (!article) {
            return NextResponse.json({ message: "Article not found" }, { status: 404 });
        }

        return NextResponse.json(article);
    } catch (error) {
        console.error("Error fetching article:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params;
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const article = await prisma.article.findUnique({
            where: { id: params.id },
        });

        if (!article) {
            return NextResponse.json({ message: "Article not found" }, { status: 404 });
        }

        if (article.userId !== (session.user as any).id) {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        await prisma.article.delete({
            where: { id: params.id },
        });

        return NextResponse.json({ message: "Article deleted" });
    } catch (error) {
        console.error("Error deleting article:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}

export async function PATCH(
    req: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params;
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const userId = (session.user as any).id;

        const { action } = await req.json();

        if (action === "report") {
            const article = await prisma.article.findUnique({ where: { id: params.id } });
            if (!article) {
                return NextResponse.json({ message: "Article not found" }, { status: 404 });
            }

            if (article.userId === userId) {
                return NextResponse.json({ message: "You cannot report your own article" }, { status: 400 });
            }

            let reportsList = article.reports ? article.reports.split(",").map((id: string) => id.trim()).filter((id: string) => id.length > 0) : [];

            if (!reportsList.includes(userId)) {
                reportsList.push(userId);
            }

            // Auto delete if 5 unique reports
            if (reportsList.length >= 5) {
                await prisma.article.delete({ where: { id: params.id } });
                return NextResponse.json({ message: "Article deleted due to reports" });
            } else {
                await prisma.article.update({
                    where: { id: params.id },
                    data: { reports: reportsList.join(",") }
                });
                return NextResponse.json({ message: "Article reported" });
            }
        }

        return NextResponse.json({ message: "Invalid action" }, { status: 400 });
    } catch (error) {
        console.error("Error updating article:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
