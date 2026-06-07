"use client";

import { MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function SupportPage() {
  return (
    <div className="flex h-[calc(100vh-80px)] items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardContent className="pt-10 pb-10 text-center space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/10">
            <MessageSquare className="h-8 w-8 text-cyan-400" />
          </div>
          <h2 className="text-xl font-bold">Support Chat</h2>
          <p className="text-sm text-muted-foreground">
            The support chat interface connects directly to the PicknDrop support agent dashboard.
            Launch the main PicknDrop app and navigate to{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">/admin</code> for the live
            support console with real-time conversation management.
          </p>
          <a
            href="http://localhost:3000/admin"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-black hover:bg-cyan-400 transition-colors"
          >
            Open Support Console ↗
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
