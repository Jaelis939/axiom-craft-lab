import { useEffect, useRef } from "react";

export function GameFrame({ html, title }: { html: string; title: string }) {
  const ref = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const frame = ref.current;
    if (!frame) return;
    frame.srcdoc = html;
  }, [html]);

  return (
    <iframe
      ref={ref}
      title={title}
      className="h-full w-full border-0 bg-black"
      sandbox="allow-scripts allow-pointer-lock"
    />
  );
}
