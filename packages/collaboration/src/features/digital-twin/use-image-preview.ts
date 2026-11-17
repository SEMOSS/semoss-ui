import { useEffect, useState } from "react";
import { getCatalogImageValidationError } from "@semoss/sdk";

/**
 * An address a chosen image file can be shown from before it is uploaded.
 *
 * @param file - The chosen file, if any.
 * @returns The address, or an empty string for no file or one that is not an image the server takes.
 */
export function useImagePreview(file: File | null | undefined): string {
	const [preview, setPreview] = useState("");
	useEffect(() => {
		if (!file || getCatalogImageValidationError(file)) {
			setPreview("");
			return;
		}
		const url = URL.createObjectURL(file);
		setPreview(url);
		return () => URL.revokeObjectURL(url);
	}, [file]);
	return preview;
}
