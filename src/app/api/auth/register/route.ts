import { NextResponse as NextResp } from "next/server";
import bcryptjs from "bcryptjs";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const { name, email, password } = await req.json();

        if (!email || !password || !name) {
            return NextResp.json({ message: "Missing required fields" }, { status: 400 });
        }

        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResp.json({ message: "User already exists" }, { status: 400 });
        }

        const hashedPassword = await bcryptjs.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
            },
        });

        return NextResp.json({ message: "User created successfully", user: { id: user.id, email: user.email } }, { status: 201 });
    } catch (error) {
        console.error("Registration error:", error);
        return NextResp.json({ message: "Internal server error" }, { status: 500 });
    }
}
