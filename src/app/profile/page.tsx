"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Loader2, Save, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const LANGUAGE_LABELS: Record<string, string> = {
    "zh": "Simplified Chinese (简体中文)",
    "zh-TW": "Traditional Chinese (繁体中文)",
    "en": "English (English Definitions)"
};

export default function ProfilePage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [language, setLanguage] = useState("zh");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
        if (status === "authenticated") {
            fetchProfile();
        }
    }, [status, router]);

    const fetchProfile = async () => {
        try {
            const res = await fetch("/api/user/language");
            if (res.ok) {
                const data = await res.json();
                setLanguage(data.language);
            }
        } catch {
            toast.error("Failed to load profile");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveLanguage = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/user/language", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ language }),
            });
            if (res.ok) {
                toast.success("Language preferences updated!");
            } else {
                toast.error("Failed to update preferences");
            }
        } catch {
            toast.error("An error occurred");
        } finally {
            setSaving(false);
        }
    };

    if (loading || status === "loading") {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
            </div>
        );
    }

    return (
        <div className="max-w-xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-4xl font-serif font-bold tracking-tight text-primary">Profile</h1>
                <p className="text-muted-foreground mt-2">Manage your account and preferences.</p>
            </div>

            <Card className="rounded-3xl border-border/50 shadow-sm">
                <CardHeader>
                    <CardTitle className="font-serif text-2xl">Account details</CardTitle>
                    <CardDescription>Logged in as {session?.user?.email}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-foreground/80">Translation Target Language</label>
                        <Select value={language} onValueChange={(val) => val && setLanguage(val)}>
                            <SelectTrigger className="w-full rounded-2xl bg-muted/50 border-none h-14 px-4 focus:ring-2 focus:ring-primary/50 text-base">
                                <span className={language ? "text-foreground" : "text-muted-foreground"}>
                                    {language ? LANGUAGE_LABELS[language] : "Select a language"}
                                </span>
                            </SelectTrigger>
                            <SelectContent alignItemWithTrigger={false} className="rounded-2xl border-border/50 shadow-md">
                                <SelectItem value="zh" className="py-3 px-4 rounded-xl cursor-pointer hover:bg-muted/50 transition-colors">Simplified Chinese (简体中文)</SelectItem>
                                <SelectItem value="zh-TW" className="py-3 px-4 rounded-xl cursor-pointer hover:bg-muted/50 transition-colors">Traditional Chinese (繁体中文)</SelectItem>
                                <SelectItem value="en" className="py-3 px-4 rounded-xl cursor-pointer hover:bg-muted/50 transition-colors">English (English Definitions)</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground pt-1">This language will be used when you click on words to translate them in the Article Bank.</p>
                    </div>

                    <Button
                        onClick={handleSaveLanguage}
                        disabled={saving}
                        className="w-full rounded-xl py-6 text-base shadow-sm hover:shadow-md transition-all gap-2"
                    >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Save Preferences
                    </Button>
                </CardContent>
            </Card>

            <Card className="rounded-3xl border-destructive/20 bg-destructive/5 shadow-sm">
                <CardContent className="pt-6">
                    <Button
                        variant="destructive"
                        className="w-full rounded-xl py-6 text-base shadow-sm hover:shadow-md transition-all font-medium"
                        onClick={() => signOut({ callbackUrl: "/login" })}
                    >
                        <LogOut className="mr-2 h-4 w-4" /> Sign Out / Switch Account
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
