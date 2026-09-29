import { FileIcon, XIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { Button, Muted, Small } from "@semoss/ui/next";

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
		<div className="flex max-w-full items-center gap-2 rounded-xl border bg-background p-2">
			{preview ? (
				<img
					src={preview}
					alt=""
					className="size-9 shrink-0 rounded-md object-cover"
				/>
			) : (
				<FileIcon
					aria-hidden="true"
					className="size-5 shrink-0 text-muted-foreground"
				/>
			)}
			<div className="min-w-0 flex-1">
				<Small className="max-w-48 break-words font-medium text-xs">
					{file.name}
				</Small>
				<Muted className="text-xs">
					{(file.size / 1024).toFixed(1)} KB
				</Muted>
			</div>
			<Button
				type="button"
				variant="ghost"
				size="icon-sm"
				aria-label={t("studio.removeFile", { name: file.name })}
				onClick={onRemove}
			>
				<XIcon aria-hidden="true" />
			</Button>
		</div>
	);
}
