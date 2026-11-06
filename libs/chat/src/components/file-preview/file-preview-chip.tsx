import { useEffect, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { FilePreviewTile } from "./file-preview-tile";

interface FilePreviewChipProps {
	/** File waiting to be submitted. */
	file: File;
	/** Removes only this pending attachment. */
	onRemove: () => void;
}

/** A named attachment and persistent remove control for mouse, keyboard, and touch. */
export function FilePreviewChip({ file, onRemove }: FilePreviewChipProps) {
	const { t } = useTranslation("room");
	const [preview, setPreview] = useState("");
	useEffect(() => {
		if (!file.type.startsWith("image/")) return;
		const url = URL.createObjectURL(file);
		setPreview(url);
		return () => URL.revokeObjectURL(url);
	}, [file]);
	return (
		<FilePreviewTile
			name={file.name}
			detail={`${(file.size / 1024).toFixed(1)} KB`}
			previewUrl={preview}
			removeLabel={t("studio.removeFile", { name: file.name })}
			onRemove={onRemove}
		/>
	);
}
