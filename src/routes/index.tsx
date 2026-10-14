import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense, useEffect, useState } from "react";

const CymaticApp = lazy(() => import("@/cymatic/App"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cymatic Discipline OS — Focus, Prayer & Self-Discipline" },
      { name: "description", content: "Tasks, wallet discipline, prayer times, Qibla, lockdown protocols and the Rama AI assistant in one discipline OS." },
      { property: "og:title", content: "Cymatic Discipline OS" },
      { property: "og:description", content: "Your all-in-one self-discipline operating system with the Rama AI assistant." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const loading = <div className="fixed inset-0 bg-background" />;
  if (!mounted) return loading;
  return (
    <Suspense fallback={loading}>
      <CymaticApp />
    </Suspense>
  );
}
