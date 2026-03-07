"use client";

import { useEffect, useState, use } from "react";
import { useParams } from "next/navigation";
import { Loader2, ArrowLeft, BookmarkPlus, Volume2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function ArticleReadPage({ params }: { params: Promise<{ id: string }> }) {
    const unwrappedParams = use(params);
    const [article, setArticle] = useState<{ id: string; title: string; content: string } | null>(null);
    const [loading, setLoading] = useState(true);

    // Translation state
    const [selectedWord, setSelectedWord] = useState<string | null>(null);
    const [translation, setTranslation] = useState<string | null>(null);
    const [translating, setTranslating] = useState(false);
    const [popoverOpen, setPopoverOpen] = useState<{ [wordId: string]: boolean }>({});
    const [tagsInput, setTagsInput] = useState("");

    useEffect(() => {
        const fetchArticle = async () => {
            try {
                const res = await fetch(`/api/articles/${unwrappedParams.id}`);
                if (res.ok) {
                    const data = await res.json();
                    setArticle(data);
                } else {
                    toast.error("Article not found");
                }
            } catch (error) {
                toast.error("Failed to load article");
            } finally {
                setLoading(false);
            }
        };
        fetchArticle();
    }, [unwrappedParams.id]);

    const handleWordClick = async (wordStr: string, wordId: string) => {
        // Clean punctuation around the word
        const cleanedWord = wordStr.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").trim().toLowerCase();

        if (!cleanedWord) return;

        // TTS
        const utterance = new SpeechSynthesisUtterance(cleanedWord);
        utterance.lang = "en-US";
        window.speechSynthesis.speak(utterance);

        // Fetch Translation
        setSelectedWord(cleanedWord);
        setTranslating(true);
        setTranslation(null);

        // Close others
        setPopoverOpen({ [wordId]: true });
        setTagsInput(""); // Reset tag input for new word

        try {
            const res = await fetch(`/api/translate?word=${encodeURIComponent(cleanedWord)}`);
            if (res.ok) {
                const data = await res.json();
                setTranslation(data.translation);
            } else {
                setTranslation("No precise definition found.");
            }
        } catch {
            setTranslation("Error fetching definition.");
        } finally {
            setTranslating(false);
        }
    };

    const handleSaveWord = async () => {
        if (!selectedWord || !translation) return;

        try {
            const res = await fetch("/api/words", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ word: selectedWord, translation, tags: tagsInput }),
            });

            if (res.ok) {
                toast.success(`"${selectedWord}" saved to Word Bank`);
                setPopoverOpen({}); // close popover
            } else if (res.status === 409) {
                toast.info(`"${selectedWord}" is already in your Word Bank`);
            } else {
                toast.error("Failed to save word");
            }
        } catch (error) {
            toast.error("Something went wrong");
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
            </div>
        );
    }

    if (!article) return null;

    // Simple tokenization by whitespace.
    const words = article.content.split(/\s+/);

    return (
        <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-700">
            <Link href="/articles" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Bank
            </Link>

            <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight text-foreground leading-tight">
                    {article.title}
                </h1>
                <div className="h-1 w-20 bg-primary/20 rounded-full" />
            </div>

            <div className="prose prose-lg dark:prose-invert max-w-none font-serif leading-relaxed text-foreground/90">
                <p className="indent-8 text-xl tracking-wide">
                    {words.map((word, i) => {
                        const wordId = `word-${i}`;
                        return (
                            <span key={i}>
                                <Popover
                                    open={popoverOpen[wordId] || false}
                                    onOpenChange={(open) => {
                                        if (!open) setPopoverOpen((prev) => ({ ...prev, [wordId]: false }));
                                    }}
                                >
                                    <PopoverTrigger
                                        onClick={() => handleWordClick(word, wordId)}
                                        className={`cursor-pointer transition-colors duration-200 hover:bg-primary/20 hover:text-primary rounded-md px-0.5 ${popoverOpen[wordId] ? 'bg-primary/20 text-primary' : ''}`}
                                    >
                                        {word}
                                    </PopoverTrigger>
                                    <PopoverContent className="w-80 rounded-2xl p-4 shadow-lg border-border/50 animate-in zoom-in-95">
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-serif font-bold text-lg text-primary capitalize">{selectedWord}</h4>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-primary" onClick={() => {
                                                    const utterance = new SpeechSynthesisUtterance(selectedWord || "");
                                                    utterance.lang = "en-US";
                                                    window.speechSynthesis.speak(utterance);
                                                }}>
                                                    <Volume2 className="h-4 w-4" />
                                                </Button>
                                            </div>

                                            {translating ? (
                                                <div className="flex items-center text-sm text-muted-foreground">
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Fetching definition...
                                                </div>
                                            ) : (
                                                <p className="text-sm text-foreground/80 leading-relaxed font-sans bg-muted/30 p-3 rounded-xl">
                                                    {translation}
                                                </p>
                                            )}

                                            {!translating && selectedWord && (
                                                <div className="space-y-3 mt-4">
                                                    <Input
                                                        placeholder="Tags (comma separated, e.g. verb, hard)"
                                                        value={tagsInput}
                                                        onChange={(e) => setTagsInput(e.target.value)}
                                                        className="h-8 text-xs rounded-xl bg-muted/50 border-none"
                                                    />
                                                    <Button onClick={handleSaveWord} className="w-full rounded-xl gap-2" variant="secondary">
                                                        <BookmarkPlus className="h-4 w-4" /> Save to Word Bank
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </PopoverContent>
                                </Popover>{" "}
                            </span>
                        );
                    })}
                </p>
            </div>
        </div>
    );
}
