import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!(session?.user as any)?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: (session!.user as any).id },
            select: { language: true, name: true, email: true }
        });

        if (!user) {
            return NextResponse.json({ message: "User not found" }, { status: 404 });
        }

        return NextResponse.json(user);
    } catch (error) {
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!(session?.user as any)?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { language } = await req.json();

        if (!["en", "zh", "zh-TW"].includes(language)) {
            return NextResponse.json({ message: "Invalid language" }, { status: 400 });
        }

        const updatedUser = await prisma.user.update({
            where: { id: (session!.user as any).id },
            data: { language },
            select: { language: true }
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
