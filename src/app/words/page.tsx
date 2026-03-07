"use client";

import { useState, useEffect } from "react";
import { Loader2, Trash2, RotateCcw, Volume2, CheckCircle2, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { differenceInDays } from "date-fns";

export default function WordsPage() {
    const [words, setWords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [tagFilter, setTagFilter] = useState("");

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchWords();
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [searchQuery, tagFilter]);

    const fetchWords = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (searchQuery) params.append("search", searchQuery);
            if (tagFilter) params.append("tag", tagFilter);

            const url = `/api/words${params.toString() ? '?' + params.toString() : ''}`;
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                // Calculate dynamic score based on forgetting curve simple logic
                const updatedWords = data.map((w: any) => {
                    const daysPassed = differenceInDays(new Date(), new Date(w.lastReviewedAt));
                    // Score decays by 15 points per day
                    const currentScore = Math.max(0, w.score - (daysPassed * 15));
                    return { ...w, currentScore };
                });
                setWords(updatedWords);
            }
        } catch {
            toast.error("Failed to load words");
        } finally {
            setLoading(false);
        }
    };

    const handleReview = async (id: string, remembered: boolean, currentScore: number) => {
        // Basic super simple spaced repetition modifier
        const newScore = remembered ? Math.min(100, currentScore + 20) : Math.max(0, currentScore - 20);

        try {
            const res = await fetch(`/api/words/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ score: newScore }),
            });
            if (res.ok) {
                toast.success(remembered ? "Great! Memory strengthened." : "Keep practicing!");
                fetchWords();
            }
        } catch {
            toast.error("Failed to update score");
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`/api/words/${id}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Word removed");
                fetchWords();
            }
        } catch {
            toast.error("Failed to remove word");
        }
    };

    const handleSpeak = (word: string) => {
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.lang = "en-US";
        window.speechSynthesis.speak(utterance);
    };

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-4xl font-serif font-bold tracking-tight text-primary">Word Bank</h1>
                <p className="text-muted-foreground mt-2">Review your saved vocabulary.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 max-w-2xl">
                <Input
                    type="text"
                    placeholder="Search words..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 rounded-2xl bg-muted/50 border-none shadow-sm focus-visible:ring-primary/50 text-base"
                />
                <Input
                    type="text"
                    placeholder="Filter by tag..."
                    value={tagFilter}
                    onChange={(e) => setTagFilter(e.target.value)}
                    className="flex-1 rounded-2xl bg-muted/50 border-none shadow-sm focus-visible:ring-primary/50 text-base"
                />
            </div>

            {words.length === 0 ? (
                <div className="text-center py-20 px-4 rounded-3xl bg-secondary/30 border border-border/50">
                    <h3 className="text-xl font-serif text-foreground/70 mb-2">Your Word Bank is empty</h3>
                    <p className="text-muted-foreground">Add words from the Article Bank to start memorizing.</p>
                </div>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {words.map((word) => (
                        <Card key={word.id} className="rounded-3xl border-border/50 bg-card hover:shadow-lg transition-all group flex flex-col justify-between overflow-hidden">
                            <div className="h-2 w-full" style={{ backgroundColor: `oklch(0.65 0.1 30 / ${word.currentScore}%)` }} />

                            <CardHeader className="pb-2 relative">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-4 top-4 h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => handleDelete(word.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                                <div className="flex items-center gap-2">
                                    <CardTitle className="font-serif text-2xl capitalize text-foreground group-hover:text-primary transition-colors">
                                        {word.word}
                                    </CardTitle>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full text-muted-foreground" onClick={() => handleSpeak(word.word)}>
                                        <Volume2 className="h-3 w-3" />
                                    </Button>
                                </div>
                                {word.tags && (
                                    <div className="flex gap-1 mt-2 flex-wrap">
                                        {word.tags.split(",").map((t: string) => (
                                            <span key={t} className="inline-flex items-center text-[10px] bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full font-medium">
                                                <Tag className="w-2.5 h-2.5 mr-1 opacity-70" /> {t.trim()}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </CardHeader>

                            <CardContent className="pb-4 flex-1">
                                <div className="bg-muted/30 p-3 rounded-2xl min-h-[80px]">
                                    <p className="text-sm font-sans text-foreground/80 leading-relaxed">{word.translation}</p>
                                </div>
                                <div className="mt-4 flex flex-col gap-1 items-end">
                                    <p className="text-xs text-muted-foreground font-medium">Memory Strength</p>
                                    <div className="flex items-center gap-2 w-full">
                                        <div className="h-1.5 flex-1 bg-muted rounded-full overflow-hidden">
                                            <div className="h-full bg-primary/70 transition-all duration-500" style={{ width: `${Math.min(100, Math.max(0, word.currentScore))}%` }} />
                                        </div>
                                        <span className="text-xs font-mono font-bold text-foreground/60 w-8 text-right">{Math.round(word.currentScore)}</span>
                                    </div>
                                </div>
                            </CardContent>

                            <CardFooter className="bg-secondary/20 pt-4 border-t border-border/30 gap-2">
                                <Button
                                    variant="outline"
                                    className="flex-1 rounded-xl border-border/50 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 border-dashed"
                                    onClick={() => handleReview(word.id, false, word.currentScore)}
                                >
                                    <RotateCcw className="mr-2 h-3 w-3" /> Forgot
                                </Button>
                                <Button
                                    variant="default"
                                    className="flex-1 rounded-xl bg-primary/90 hover:bg-primary text-primary-foreground shadow-sm"
                                    onClick={() => handleReview(word.id, true, word.currentScore)}
                                >
                                    <CheckCircle2 className="mr-2 h-3 w-3" /> Know It
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
