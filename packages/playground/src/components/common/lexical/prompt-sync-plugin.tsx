import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $createParagraphNode, $createTextNode, $getRoot } from "lexical";

type PromptSyncPluginProps = {
  prompt: string;
  /** If true, will overwrite existing editor content */
  overwrite?: boolean;
};

export function PromptSyncPlugin({ prompt, overwrite = false }: PromptSyncPluginProps) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // nothing to sync
    if (!prompt) return;

    editor.update(() => {
      const root = $getRoot();
      const currentText = root.getTextContent();

      // Don’t clobber user typing unless explicitly allowed
      if (!overwrite && currentText.trim().length > 0) return;

      // Avoid unnecessary updates
      if (currentText === prompt) return;

      root.clear();
      const p = $createParagraphNode();
      p.append($createTextNode(prompt));
      root.append(p);

      // Put caret at end
      root.selectEnd();
    });
  }, [editor, prompt, overwrite]);

  return null;
}