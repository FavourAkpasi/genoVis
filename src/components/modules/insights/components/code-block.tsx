import { cn } from '@/lib/utils';

interface CodeBlockProps {
  code: string;
  /** Optional filename/label shown in the header strip. */
  caption?: string;
  className?: string;
}

// Cheap comment dimming without pulling in a syntax highlighter: split a line at
// its first `//` (ignoring `://` so URLs survive) and mute the trailing comment.
const renderLine = (line: string) => {
  const match = /(^|[^:])\/\//.exec(line);
  if (!match) return line;
  const at = match.index + match[1].length;
  return (
    <>
      {line.slice(0, at)}
      <span className="text-muted-foreground/60">{line.slice(at)}</span>
    </>
  );
};

export const CodeBlock = ({ code, caption, className }: CodeBlockProps) => (
  <figure className={cn('overflow-hidden rounded-xl border bg-muted/40', className)}>
    {caption && (
      <figcaption className="border-b bg-muted/60 px-4 py-2 font-mono text-xs text-muted-foreground">
        {caption}
      </figcaption>
    )}
    <pre className="overflow-x-auto p-4 text-xs leading-relaxed sm:text-[13px]">
      <code className="font-mono">
        {code.split('\n').map((line, index) => (
          <span key={index} className="block min-h-[1.25em]">
            {renderLine(line)}
          </span>
        ))}
      </code>
    </pre>
  </figure>
);

export default CodeBlock;
