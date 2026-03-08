"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Loader2, Trash2, ShieldAlert, Globe, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

export default function ArticlesPage() {
    const { data: session } = useSession();
    const [articles, setArticles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [isPublic, setIsPublic] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState<"my" | "shared">("my");

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchArticles();
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [searchQuery, activeTab]);

    const fetchArticles = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (searchQuery) params.append("search", searchQuery);
            params.append("tab", activeTab);

            const url = `/api/articles?${params.toString()}`;
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setArticles(data);
            }
        } catch (error) {
            toast.error("Failed to fetch articles");
        } finally {
            setLoading(false);
        }
    };

    const handleAddArticle = async () => {
        if (!title || !content) {
            toast.error("Title and content are required");
            return;
        }

        try {
            const res = await fetch("/api/articles", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, content, isPublic }),
            });

            if (res.ok) {
                toast.success("Article added successfully");
                setIsDialogOpen(false);
                setTitle("");
                setContent("");
                setIsPublic(true);
                fetchArticles();
            } else {
                toast.error("Failed to add article");
            }
        } catch (error) {
            toast.error("Something went wrong");
        }
    };

    const handleDeleteArticle = async (id: string) => {
        try {
            const res = await fetch(`/api/articles/${id}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Article deleted");
                fetchArticles();
            } else {
                toast.error("Failed to delete article");
            }
        } catch {
            toast.error("Something went wrong");
        }
    };

    const handleReportArticle = async (id: string) => {
        try {
            const res = await fetch(`/api/articles/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "report" }),
            });
            if (res.ok) {
                const data = await res.json();
                toast.success(data.message);
                fetchArticles();
            } else {
                const data = await res.json();
                toast.error(data.message || "Failed to report article");
            }
        } catch {
            toast.error("Something went wrong");
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-serif font-bold tracking-tight text-primary">Article Bank</h1>
                    <p className="text-muted-foreground mt-2">Curate your reading material and extract vocabulary.</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger render={<Button className="rounded-2xl" size="lg" />}>
                        <Plus className="mr-2 h-4 w-4" /> Add Article
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] rounded-3xl">
                        <DialogHeader>
                            <DialogTitle className="font-serif text-2xl">New Article</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Input
                                    className="rounded-xl bg-muted/50 border-none px-4 py-6"
                                    placeholder="Article Title..."
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <textarea
                                    className="w-full min-h-[300px] rounded-xl bg-muted/50 border-none p-4 text-base focus-visible:outline-none focus:ring-2 focus:ring-primary/50 resize-none font-serif leading-relaxed"
                                    placeholder="Paste your English text here..."
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center space-x-2 px-1 pb-2">
                                <input
                                    type="checkbox"
                                    id="public-toggle"
                                    className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                                    checked={isPublic}
                                    onChange={(e) => setIsPublic(e.target.checked)}
                                />
                                <label htmlFor="public-toggle" className="text-sm font-medium leading-none cursor-pointer flex items-center gap-2">
                                    {isPublic ? <Globe className="w-4 h-4 text-primary" /> : <Lock className="w-4 h-4 text-muted-foreground" />}
                                    Share this article publicly
                                </label>
                            </div>
                            <Button onClick={handleAddArticle} className="w-full rounded-xl py-6 text-base shadow-md hover:shadow-lg transition-all">
                                Save Article
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex bg-muted/50 p-1 rounded-2xl w-full sm:w-auto">
                    <button
                        onClick={() => setActiveTab("my")}
                        className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'my' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        My Bank
                    </button>
                    <button
                        onClick={() => setActiveTab("shared")}
                        className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'shared' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Shared Articles
                    </button>
                </div>

                <div className="max-w-md w-full relative">
                    <Input
                        type="text"
                        placeholder="Search articles..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-4 pr-10 py-6 rounded-2xl bg-muted/50 border-none shadow-sm focus-visible:ring-primary/50 text-base"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
                </div>
            ) : articles.length === 0 ? (
                <div className="text-center py-20 px-4 rounded-3xl bg-secondary/30 border border-border/50">
                    <h3 className="text-xl font-serif text-foreground/70 mb-2">No articles yet</h3>
                    <p className="text-muted-foreground">Add your first article to start reading and extracting words.</p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {articles.map((article) => {
                        const isOwner = session?.user && (session.user as any).id === article.userId;

                        return (
                            <div key={article.id} className="relative group">
                                {isOwner ? (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-4 top-4 h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                        onClick={async (e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            await handleDeleteArticle(article.id);
                                        }}
                                        title="Delete article"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                ) : (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-4 top-4 h-8 w-8 text-muted-foreground hover:text-orange-500 hover:bg-orange-500/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                        onClick={async (e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            await handleReportArticle(article.id);
                                        }}
                                        title="Report article as inappropriate"
                                    >
                                        <ShieldAlert className="h-4 w-4" />
                                    </Button>
                                )}

                                <Link href={`/articles/${article.id}`} className="block h-full cursor-pointer">
                                    <Card className="rounded-2xl border-border/50 hover:bg-muted/30 transition-all hover:shadow-md h-full">
                                        <CardHeader>
                                            <CardTitle className="font-serif leading-snug group-hover:text-primary transition-colors pr-8 line-clamp-2" title={article.title}>
                                                {article.title}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex flex-col gap-1">
                                                <p className="text-sm text-muted-foreground">
                                                    Added {new Date(article.createdAt).toLocaleDateString()}
                                                </p>
                                                {activeTab === "shared" && article.user && (
                                                    <p className="text-xs font-medium text-primary/70 bg-primary/5 inline-flex w-fit px-2 py-0.5 rounded-full mt-1">
                                                        by {article.user.name || article.user.email.split('@')[0]}
                                                    </p>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
