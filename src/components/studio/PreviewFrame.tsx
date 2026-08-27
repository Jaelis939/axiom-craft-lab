import * as React from "react";

export type PreviewHandle = {
  /** Loads a build into the iframe and resolves with runtime errors captured. */
  run: (html: string) => Promise<string[]>;
  reload: () => void;
};

type Props = { onRuntimeError?: (message: string) => void };

export const PreviewFrame = React.forwardRef<PreviewHandle, Props>(function PreviewFrame(
  { onRuntimeError },
  ref,
) {
  const frameRef = React.useRef<HTMLIFrameElement>(null);
  const errorsRef = React.useRef<string[]>([]);
  const htmlRef = React.useRef<string>("");
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const data = event.data as { source?: string; level?: string; message?: string; stack?: string };
      if (!data || data.source !== "cryptoxi-runtime") return;
      if (data.level === "error") {
        const line = data.stack ? `${data.message}\n${data.stack.split("\n").slice(0, 3).join("\n")}` : data.message!;
        errorsRef.current.push(line);
        onRuntimeError?.(line);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [onRuntimeError]);

  React.useImperativeHandle(ref, () => ({
    async run(html: string) {
      htmlRef.current = html;
      errorsRef.current = [];
      const frame = frameRef.current;
      if (!frame) return ["Preview frame is not mounted."];
      frame.srcdoc = html;
      setLoaded(true);
      // Let the game boot and run a few hundred frames before judging it.
      await new Promise((r) => setTimeout(r, 3500));
      return [...new Set(errorsRef.current)].slice(0, 12);
    },
    reload() {
      const frame = frameRef.current;
      if (frame && htmlRef.current) {
        errorsRef.current = [];
        frame.srcdoc = htmlRef.current;
      }
    },
  }));

  return (
    <div className="relative h-full w-full bg-black">
      <iframe
        ref={frameRef}
        title="CryptoXI game preview"
        className="h-full w-full border-0 bg-black"
        sandbox="allow-scripts allow-pointer-lock allow-modals"
      />
      {!loaded && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-center text-xs text-muted-foreground">
          The running game appears here once CryptoXI builds it.
        </div>
      )}
    </div>
  );
});
