"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookA, BrainCircuit } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center text-center space-y-12 animate-in fade-in duration-1000 px-4">
      <div className="space-y-6 max-w-3xl">
        <h1 className="text-5xl md:text-7xl font-serif font-bold tracking-tight text-foreground leading-tight">
          Master English with <span className="text-primary italic">Lumina</span> Artistry.
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground font-sans max-w-2xl mx-auto leading-relaxed">
          An elegant, personalized platform to curate your reading material and build a lifelong vocabulary through spaced repetition.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Link href="/login">
          <Button size="lg" className="rounded-full px-8 py-6 text-lg h-14 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all">
            Start Learning <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
        <Link href="/articles">
          <Button size="lg" variant="outline" className="rounded-full px-8 py-6 text-lg h-14 border-2">
            Explore Articles
          </Button>
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl mt-20 text-left">
        <div className="bg-primary/5 p-8 rounded-3xl border border-primary/10">
          <BookA className="h-10 w-10 text-primary mb-4" />
          <h3 className="text-2xl font-serif font-bold mb-2">Immersive Reading</h3>
          <p className="text-muted-foreground">Click any word while reading to see definitions and hear natural pronunciation. Extract vocabulary effortlessly.</p>
        </div>
        <div className="bg-secondary/50 p-8 rounded-3xl border border-border/50">
          <BrainCircuit className="h-10 w-10 text-foreground/80 mb-4" />
          <h3 className="text-2xl font-serif font-bold mb-2">Spaced Repetition</h3>
          <p className="text-muted-foreground">Our intelligent forgetting curve algorithm knows exactly when you need to review a word before it slips away.</p>
        </div>
      </div>
    </div>
  );
}
