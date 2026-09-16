import {
	PowerPointViewer,
	type PowerPointViewerHandle,
} from "pptx-react-viewer";
import { translationsEn } from "pptx-react-viewer/i18n";
import { forwardRef, useState } from "react";
import { getI18n, useTranslation } from "@semoss/i18n";
import "pptx-react-viewer/styles";

interface FilePptxViewerContentProps {
	content: Uint8Array;
	fileName: string;
	/** Enable the full editor; the host owns persisting edits (via the ref's
	 * getContent). Defaults to a read-only viewer. */
	canEdit?: boolean;
	/** Mirror of the viewer's dirty state, for host save controls. */
	onDirtyChange?: (isDirty: boolean) => void;
}

/**
 * The viewer reads UI copy from the host i18next instance via plain
 * useTranslation(), so its English dictionary must be registered under the
 * app's default namespace or every label renders as a raw `pptx.*` key.
 */
let registered = false;
const registerViewerCopy = (i18n: ReturnType<typeof getI18n>) => {
	if (registered || !i18n) return;
	const ns = Array.isArray(i18n.options.defaultNS)
		? i18n.options.defaultNS[0]
		: (i18n.options.defaultNS ?? "translation");
	i18n.addResourceBundle("en", ns, translationsEn, true, false);
	registered = true;
};

// This module is lazy-loaded well after app i18n init, so registering at
// import time avoids i18next store events firing mid-render.
registerViewerCopy(getI18n());

/**
 * Thin wrapper around the pptx engine so the panel can lazy-load it; the
 * viewer bundle and its stylesheet stay out of the main client chunk.
 */
const FilePptxViewerContent = forwardRef<
	PowerPointViewerHandle,
	FilePptxViewerContentProps
>(({ content, fileName, canEdit = false, onDirtyChange }, ref) => {
	const { i18n } = useTranslation();
	useState(() => registerViewerCopy(i18n));

	// The scope class is where the viewer stylesheet's tokens live — the vite
	// plugin `scope-pptx-viewer-css` rewrites their `:root` selectors to it so
	// they can't repaint the rest of the app.
	return (
		<div className="pptx-viewer-scope size-full">
			<PowerPointViewer
				ref={ref}
				content={content}
				fileName={fileName}
				defaultThemeKey="light"
				canEdit={canEdit}
				onDirtyChange={onDirtyChange}
			/>
		</div>
	);
});

FilePptxViewerContent.displayName = "FilePptxViewerContent";

export default FilePptxViewerContent;
