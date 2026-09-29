import {
	FileArchiveIcon,
	FileAudioIcon,
	FileBadgeIcon,
	FileChartPieIcon,
	FileCodeIcon,
	FileIcon,
	FileJsonIcon,
	FileSpreadsheetIcon,
	FileTerminalIcon,
	FileTextIcon,
	FileTypeIcon,
	FileVideoIcon,
	XIcon,
} from "lucide-react";
import { type ReactNode, useEffect, useMemo } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	ScrollArea,
	ScrollBar,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { getFileExtension } from "@semoss/utility";

const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "gif", "webp", "svg", "img"];

const isImageFile = (file: File): boolean => {
	const ext = getFileExtension(file.name);
	return IMAGE_EXTENSIONS.includes(ext);
};

const ICON_CLASS = "size-8 shrink-0 text-muted-foreground";

const getIconForExt = (ext: string) => {
	if (["xls", "xlsx", "csv"].includes(ext)) return FileSpreadsheetIcon;
	if (
		[
			"py",
			"js",
			"ts",
			"tsx",
			"jsx",
			"java",
			"cpp",
			"c",
			"go",
			"rs",
		].includes(ext)
	)
		return FileCodeIcon;
	if (["sh", "bash", "zsh", "bat", "ps1"].includes(ext))
		return FileTerminalIcon;
	if (ext === "json") return FileJsonIcon;
	if (["zip", "tar", "gz", "rar", "7z"].includes(ext)) return FileArchiveIcon;
	if (["ppt", "pptx"].includes(ext)) return FileChartPieIcon;
	if (["mp3", "wav", "ogg", "flac", "aac"].includes(ext))
		return FileAudioIcon;
	if (["mp4", "mov", "avi", "mkv", "webm"].includes(ext))
		return FileVideoIcon;
	if (["html", "xml", "md", "mdx", "rtf"].includes(ext)) return FileTypeIcon;
	if (ext === "pdf") return FileBadgeIcon;
	if (["doc", "docx", "msg", "txt"].includes(ext)) return FileTextIcon;
	return FileIcon;
};

const getFileIcon = (name: string) => {
	const ext = getFileExtension(name);
	const Icon = getIconForExt(ext);

	return (
		<div className="flex flex-col items-center gap-1">
			<Icon aria-hidden className={ICON_CLASS} strokeWidth={1.25} />
			<span className="max-w-14 truncate font-medium text-muted-foreground text-xs uppercase">
				{ext}
			</span>
		</div>
	);
};

/** Props for {@link FilePreviewTile}. */
export interface FilePreviewTileProps {
	/** The file's name, which picks its icon and shows on hover. */
	name: string;
	/** A second line on hover, such as the file's size. */
	detail?: string;
	/** An image to show in place of the icon. */
	previewUrl?: string;
	/** A small mark in the corner, such as where the file came from. */
	badge?: ReactNode;
	/** The remove button's accessible name. */
	removeLabel: string;
	/** Takes the file off the next message. */
	onRemove: () => void;
}

/**
 * One file going with the next message: its picture or its type's icon, its
 * name and detail on hover, and a button to take it off.
 */
export const FilePreviewTile = ({
	name,
	detail,
	previewUrl,
	badge,
	removeLabel,
	onRemove,
}: FilePreviewTileProps) => (
	<Tooltip>
		<TooltipTrigger asChild>
			<div className="group relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
				{previewUrl ? (
					<img
						src={previewUrl}
						alt={name}
						className="size-full object-cover"
					/>
				) : (
					getFileIcon(name)
				)}
				{badge ? (
					<span className="absolute bottom-1 left-1 flex rounded-sm bg-background p-0.5 text-muted-foreground">
						{badge}
					</span>
				) : null}
				<Button
					variant="destructive"
					size="icon"
					className="absolute top-1 right-1 size-5 opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
					aria-label={removeLabel}
					onClick={onRemove}
				>
					<XIcon aria-hidden className="size-3" />
				</Button>
			</div>
		</TooltipTrigger>
		<TooltipContent>
			<p className="max-w-48 truncate text-xs">{name}</p>
			{detail ? (
				<p className="text-muted-foreground text-xs">{detail}</p>
			) : null}
		</TooltipContent>
	</Tooltip>
);

interface FilePreviewGridProps {
	files: File[];
	onRemoveFile: (index: number) => void;
	/**
	 * Tiles to show before the files, in the same row, such as files already
	 * in the chat that go with the next message.
	 */
	leading?: ReactNode;
}

export const FilePreviewGrid = ({
	files,
	onRemoveFile,
	leading,
}: FilePreviewGridProps) => {
	const { t } = useTranslation("room");
	const previewUrls = useMemo(() => {
		const map = new Map<string, string>();
		for (const f of files) {
			if (!isImageFile(f)) continue;
			const key = `${f.name}-${f.size}-${f.lastModified}`;
			map.set(key, URL.createObjectURL(f));
		}
		return map;
	}, [files]);

	useEffect(() => {
		return () => {
			for (const url of previewUrls.values()) URL.revokeObjectURL(url);
		};
	}, [previewUrls]);

	if (files.length === 0 && !leading) return null;

	return (
		<ScrollArea type="always">
			{/* pb-3 is for scroll bar, it's up to the caller to make this look decent */}
			<div className="flex w-max gap-2 pb-3">
				{leading}
				{files.map((file, idx) => {
					const key = `${file.name}-${file.size}-${file.lastModified}-${idx}`;
					return (
						<FilePreviewTile
							key={key}
							name={file.name}
							detail={`${(file.size / 1024).toFixed(1)} KB`}
							previewUrl={previewUrls.get(
								`${file.name}-${file.size}-${file.lastModified}`,
							)}
							removeLabel={t("input.removeFile", {
								name: file.name,
							})}
							onRemove={() => onRemoveFile(idx)}
						/>
					);
				})}
			</div>
			<ScrollBar orientation="horizontal" className="-mr-2" />
		</ScrollArea>
	);
};
