"use client";

import { useEffect, useState, use } from "react";
import { useParams } from "next/navigation";
import { Loader2, ArrowLeft, BookmarkPlus, Volume2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function ArticleReadPage({ params }: { params: Promise<{ id: string }> }) {
    const unwrappedParams = use(params);
    const [article, setArticle] = useState<{ id: string; title: string; content: string } | null>(null);
    const [loading, setLoading] = useState(true);

    // Translation state
    const [selectedWord, setSelectedWord] = useState<string | null>(null);
    const [translationData, setTranslationData] = useState<{
        translation: string;
        phonetic?: string;
        meanings?: { partOfSpeech: string, definitions: string[] }[];
    } | null>(null);
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
        const cleanedWord = wordStr.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, "").trim().toLowerCase();

        if (!cleanedWord) return;

        // TTS
        const utterance = new SpeechSynthesisUtterance(cleanedWord);
        utterance.lang = "en-US";
        window.speechSynthesis.speak(utterance);

        // Fetch Translation
        setSelectedWord(cleanedWord);
        setTranslating(true);
        setTranslationData(null);

        // Close others
        setPopoverOpen({ [wordId]: true });
        setTagsInput(""); // Reset tag input for new word

        try {
            const res = await fetch(`/api/translate?word=${encodeURIComponent(cleanedWord)}`);
            if (res.ok) {
                const data = await res.json();
                setTranslationData(data);
            } else {
                setTranslationData({ translation: "No precise definition found." });
            }
        } catch {
            setTranslationData({ translation: "Error fetching definition." });
        } finally {
            setTranslating(false);
        }
    };

    const handleSaveWord = async () => {
        if (!selectedWord || !translationData?.translation) return;

        try {
            const res = await fetch("/api/words", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    word: selectedWord,
                    translation: JSON.stringify(translationData),
                    tags: tagsInput
                }),
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

    let globalWordIndex = 0;

    // Custom component to render text with click-to-translate functionality
    const renderTextNode = (text: string) => {
        const words = text.split(/(\s+)/); // Preserve spaces
        return words.map((wordOrSpace, i) => {
            if (/^\s+$/.test(wordOrSpace)) {
                return <span key={`space-${globalWordIndex}-${i}`}>{wordOrSpace}</span>;
            }

            // Also check if it's just punctuation and shouldn't be clickable
            const isJustPunctuation = /^[^a-zA-Z0-9]+$/.test(wordOrSpace);

            if (isJustPunctuation) {
                return <span key={`punct-${globalWordIndex}-${i}`}>{wordOrSpace}</span>;
            }

            const wordId = `word-${globalWordIndex++}`;
            return (
                <span key={wordId} className="inline-block">
                    <Popover
                        open={popoverOpen[wordId] || false}
                        onOpenChange={(open) => {
                            if (!open) setPopoverOpen((prev) => ({ ...prev, [wordId]: false }));
                        }}
                    >
                        <PopoverTrigger
                            onClick={() => handleWordClick(wordOrSpace, wordId)}
                            className={`cursor-pointer transition-colors duration-200 hover:bg-primary/20 hover:text-primary rounded-sm px-[1px] ${popoverOpen[wordId] ? 'bg-primary/20 text-primary' : ''}`}
                        >
                            {wordOrSpace}
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
                                    <div className="flex items-center text-sm text-muted-foreground p-2">
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Fetching definition...
                                    </div>
                                ) : translationData ? (
                                    <div className="space-y-3 bg-muted/30 p-3 rounded-xl">
                                        <div>
                                            <p className="text-base font-medium text-foreground pb-1">
                                                {translationData.translation}
                                            </p>
                                            {translationData.phonetic && (
                                                <p className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded-md inline-block">
                                                    {translationData.phonetic}
                                                </p>
                                            )}
                                        </div>

                                        {translationData.meanings && translationData.meanings.length > 0 && (
                                            <div className="space-y-2 mt-2 pt-2 border-t border-border/50">
                                                {translationData.meanings.map((m, idx) => (
                                                    <div key={idx} className="text-sm">
                                                        <span className="text-xs font-semibold text-primary/70 italic mr-2">{m.partOfSpeech}</span>
                                                        <span className="text-muted-foreground">{m.definitions[0]}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : null}

                                {!translating && selectedWord && (
                                    <div className="space-y-3 mt-4 border-t border-border/50 pt-3">
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
                    </Popover>
                </span>
            );
        });
    };

    // Helper component to parse children of markdown elements and apply the word renderer
    const TranslateableContent = ({ children }: { children: React.ReactNode }) => {
        if (typeof children === 'string') {
            return <>{renderTextNode(children)}</>;
        }

        if (Array.isArray(children)) {
            return (
                <>
                    {children.map((child, idx) => (
                        <span key={`child-${idx}`}>
                            {typeof child === 'string' ? renderTextNode(child) : child}
                        </span>
                    ))}
                </>
            )
        }

        return <>{children}</>;
    };

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

            <div className="prose prose-lg dark:prose-invert max-w-none font-serif leading-relaxed text-foreground/90 pb-20">
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                        p: ({ node, ...props }) => <p className="mb-4 tracking-wide text-xl leading-relaxed" {...props}><TranslateableContent>{props.children}</TranslateableContent></p>,
                        h1: ({ node, ...props }) => <h1 className="text-3xl font-bold mt-8 mb-4 border-b pb-2" {...props}><TranslateableContent>{props.children}</TranslateableContent></h1>,
                        h2: ({ node, ...props }) => <h2 className="text-2xl font-bold mt-6 mb-3" {...props}><TranslateableContent>{props.children}</TranslateableContent></h2>,
                        h3: ({ node, ...props }) => <h3 className="text-xl font-bold mt-4 mb-2" {...props}><TranslateableContent>{props.children}</TranslateableContent></h3>,
                        li: ({ node, ...props }) => <li className="mb-1 leading-relaxed text-xl" {...props}><TranslateableContent>{props.children}</TranslateableContent></li>,
                        blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-primary/50 pl-4 py-1 italic bg-muted/30 rounded-r-lg my-4" {...props}><TranslateableContent>{props.children}</TranslateableContent></blockquote>,
                        img: ({ node, ...props }) => <img className="rounded-xl border border-border/50 shadow-md my-4 max-w-full" alt={props.alt || ""} {...props} />,
                        pre: ({ node, ...props }) => <pre className="p-4 rounded-xl overflow-x-auto text-sm font-mono bg-slate-950 text-slate-50 leading-relaxed my-4 border border-border/50 shadow-md" {...props} />,
                        code: ({ node, className, children, ...props }) => {
                            const isInline = !className?.includes('language-') && !String(children).includes('\n');
                            if (isInline) {
                                return <code className="bg-muted px-1.5 py-0.5 rounded-md text-sm font-mono text-primary/80" {...props}>{children}</code>;
                            }
                            return <code className={className} {...props}>{children}</code>;
                        },
                    }}
                >
                    {article.content}
                </ReactMarkdown>
            </div>
        </div>
    );
}
