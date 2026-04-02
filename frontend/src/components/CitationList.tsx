import { BookOpen } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
import type { Citation } from "../types/content";

interface CitationListProps {
  citations: Citation[];
}

export function CitationList({ citations }: CitationListProps) {
  if (citations.length === 0) return null;

  return (
    <div className="space-y-2">
      <span className="text-sm font-medium flex items-center gap-1.5">
        <BookOpen className="h-3.5 w-3.5" />
        Citations ({citations.length})
      </span>
      <Accordion type="multiple" className="w-full">
        {citations.map((citation) => (
          <AccordionItem
            key={citation.citation_number}
            value={`citation-${citation.citation_number}`}
          >
            <AccordionTrigger className="text-sm py-2">
              <span className="flex items-center gap-2">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs font-medium">
                  {citation.citation_number}
                </span>
                <span className="truncate">{citation.source_id}</span>
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <blockquote className="border-l-2 border-muted-foreground/30 pl-3 text-sm italic text-muted-foreground">
                {citation.cited_text}
              </blockquote>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
