"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const [isRegistering, setIsRegistering] = useState(false);
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (isRegistering) {
            // Register
            try {
                const res = await fetch("/api/auth/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name, email, password }),
                });
                if (res.ok) {
                    toast.success("Account created! Logging in...");
                    await signIn("credentials", { email, password, redirect: false });
                    router.push("/dashboard");
                } else {
                    const data = await res.json();
                    toast.error(data.message || "Registration failed");
                }
            } catch {
                toast.error("An error occurred");
            }
        } else {
            // Login
            try {
                const res = await signIn("credentials", {
                    email,
                    password,
                    redirect: false,
                });
                if (res?.error) {
                    toast.error(res.error);
                } else {
                    toast.success("Login successful!");
                    router.push("/dashboard");
                }
            } catch {
                toast.error("Failed to login");
            }
        }
        setLoading(false);
    };

    return (
        <div className="flex justify-center items-start pt-[10vh] md:items-center min-h-[70vh] px-4 pb-12 animate-in zoom-in-95 duration-500">
            <Card className="w-full max-w-md rounded-3xl border-border/50 shadow-xl mt-4 md:mt-0">
                <CardHeader className="space-y-2 text-center pt-8">
                    <CardTitle className="text-3xl font-serif font-bold text-primary">
                        {isRegistering ? "Create your account" : "Welcome back"}
                    </CardTitle>
                    <CardDescription className="text-base">
                        {isRegistering ? "Start curating your English knowledge." : "Enter your credentials to access your dashboard."}
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4 pt-4 pb-6 px-8">
                        {isRegistering && (
                            <div className="space-y-2">
                                <Input
                                    className="h-14 rounded-xl px-4 bg-muted/50 border-none"
                                    placeholder="Your Name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>
                        )}
                        <div className="space-y-2">
                            <Input
                                className="h-14 rounded-xl px-4 bg-muted/50 border-none"
                                type="email"
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Input
                                className="h-14 rounded-xl px-4 bg-muted/50 border-none"
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex-col gap-4 pb-8 px-8">
                        <Button className="w-full h-14 rounded-xl text-base" type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isRegistering ? "Sign Up" : "Sign In"}
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            className="w-full hover:bg-transparent hover:text-primary transition-colors"
                            onClick={() => setIsRegistering(!isRegistering)}
                        >
                            {isRegistering ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
