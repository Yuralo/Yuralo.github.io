"use client";

interface ReferencesProps {
  citations: Record<string, string>;
}

export function References({ citations }: ReferencesProps) {
  if (!citations || Object.keys(citations).length === 0) {
    return null;
  }

  // Sort by numeric ID
  const sortedEntries = Object.entries(citations).sort((a, b) => {
    const numA = parseInt(a[0]);
    const numB = parseInt(b[0]);
    return numA - numB;
  });

  return (
    <div className="mt-16 pt-8 border-t border-border">
      <h2 className="text-2xl font-bold mb-6 text-foreground">References</h2>
      <ol className="space-y-4">
        {sortedEntries.map(([id, citation]) => (
          <li key={id} className="flex gap-3 text-sm">
            <span className="text-primary font-mono font-semibold shrink-0">
              [{id}]
            </span>
            <span className="text-muted-foreground leading-relaxed">
              {citation}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
