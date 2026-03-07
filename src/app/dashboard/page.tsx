"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { differenceInDays } from "date-fns";
import { Bell, BookOpen, GraduationCap, Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
    const { data: session, status } = useSession();
    const [words, setWords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === "unauthenticated") {
            redirect("/login");
        }
        if (status === "authenticated") {
            fetchWords();
        }
    }, [status]);

    const fetchWords = async () => {
        try {
            const res = await fetch("/api/words");
            if (res.ok) {
                const data = await res.json();
                setWords(data);
            }
        } catch {
            console.error("Failed to load words");
        } finally {
            setLoading(false);
        }
    };

    if (status === "loading" || loading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
            </div>
        );
    }

    // Calculate words needing review (score < 50)
    const wordsToReview = words.filter((w) => {
        const daysPassed = differenceInDays(new Date(), new Date(w.lastReviewedAt));
        const currentScore = Math.max(0, w.score - (daysPassed * 15));
        return currentScore < 50;
    });

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-primary/5 rounded-3xl p-8 border border-primary/10">
                <h1 className="text-4xl font-serif font-bold tracking-tight text-foreground">
                    Welcome back, {session?.user?.name || session?.user?.email?.split('@')[0]}
                </h1>
                <p className="text-muted-foreground mt-2 text-lg">Your personal English learning center.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="rounded-3xl border-border/50 bg-card overflow-hidden">
                    <div className="bg-primary/10 p-6 flex items-center justify-between border-b border-primary/5">
                        <div>
                            <CardTitle className="font-serif text-2xl text-primary flex items-center gap-2">
                                <Bell className="h-5 w-5" />
                                Messages
                            </CardTitle>
                        </div>
                    </div>
                    <CardContent className="p-6">
                        {wordsToReview.length > 0 ? (
                            <div className="space-y-4">
                                <p className="text-muted-foreground">
                                    You have <strong className="text-foreground">{wordsToReview.length} words</strong> whose memory strength has decayed.
                                    It's time to review them before you forget!
                                </p>
                                <div className="bg-destructive/10 text-destructive-foreground p-4 rounded-2xl flex flex-wrap gap-2">
                                    {wordsToReview.slice(0, 10).map((w) => (
                                        <span key={w.id} className="bg-background/80 px-2 py-1 rounded-md text-sm font-medium border border-destructive/20 text-destructive">{w.word}</span>
                                    ))}
                                    {wordsToReview.length > 10 && <span className="px-2 py-1 text-sm opacity-70">+{wordsToReview.length - 10} more</span>}
                                </div>
                                <Link href="/words" className="block mt-4">
                                    <Button className="w-full rounded-xl">Review Now</Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-full mb-4">
                                    <GraduationCap className="h-8 w-8 text-primary" />
                                </div>
                                <h3 className="font-serif text-xl mb-2">All Caught Up!</h3>
                                <p className="text-muted-foreground text-sm">Your memory strength is excellent. Keep reading to find more words.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="rounded-3xl border-border/50 bg-card overflow-hidden flex flex-col">
                    <div className="bg-secondary p-6 border-b border-border/50">
                        <CardTitle className="font-serif text-2xl text-foreground flex items-center gap-2">
                            <BookOpen className="h-5 w-5" />
                            Quick Stats
                        </CardTitle>
                    </div>
                    <CardContent className="p-6 flex-1 flex flex-col justify-center gap-6">
                        <div className="flex items-center justify-between p-4 bg-background rounded-2xl border border-border/50">
                            <span className="text-muted-foreground">Total Vocabulary</span>
                            <span className="text-3xl font-bold font-serif text-primary">{words.length}</span>
                        </div>
                        <Link href="/articles">
                            <Button variant="outline" className="w-full rounded-xl border-dashed">
                                Go to Article Bank
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
