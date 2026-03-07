import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function PATCH(
    req: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params;
        const session = await getServerSession(authOptions);
        if (!(session?.user as any)?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { score, tags } = await req.json();

        const dataToUpdate: any = {};
        if (score !== undefined) dataToUpdate.score = score;
        if (tags !== undefined) dataToUpdate.tags = tags;
        // Only update lastReviewedAt if we are updating the score (reviewing)
        if (score !== undefined) dataToUpdate.lastReviewedAt = new Date();

        const word = await prisma.word.update({
            where: { id: params.id, userId: (session!.user as any).id },
            data: dataToUpdate,
        });

        return NextResponse.json(word);
    } catch (error) {
        console.error("Error updating word score:", error);
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
        if (!(session?.user as any)?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await prisma.word.delete({
            where: { id: params.id, userId: (session!.user as any).id },
        });

        return NextResponse.json({ message: "Word deleted" });
    } catch (error) {
        console.error("Error deleting word:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
