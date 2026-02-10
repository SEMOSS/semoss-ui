import { useEffect, useRef } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getRoot } from "lexical";
import { PASTE_COMMAND, COMMAND_PRIORITY_LOW } from "lexical";

export function AutoScrollOnPastePlugin(props: {
  scrollContainerRef: React.RefObject<HTMLElement | null>;
}) {
  const [editor] = useLexicalComposerContext();
  const didPasteRef = useRef(false);

  useEffect(() => {
    return editor.registerCommand<ClipboardEvent>(
      PASTE_COMMAND,
      () => {
        didPasteRef.current = true;

        requestAnimationFrame(() => {
          if (!didPasteRef.current) return;
          didPasteRef.current = false;

          editor.update(() => {
            $getRoot().selectEnd();
          });

          const el = props.scrollContainerRef.current;
          if (el) el.scrollTop = el.scrollHeight;
        });

        return false; // let Lexical perform its normal paste
      },
      COMMAND_PRIORITY_LOW,
    );
  }, [editor, props.scrollContainerRef]);

  return null;
}
