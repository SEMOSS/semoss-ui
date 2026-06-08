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
import { useEffect, useMemo } from "react";
import {
	Button,
	ScrollArea,
	ScrollBar,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";

const IMAGE_EXTENSIONS = ["png", "jpg", "jpeg", "gif", "webp", "svg", "img"];

const isImageFile = (file: File): boolean => {
	const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
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

const getFileIcon = (file: File) => {
	const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
	const Icon = getIconForExt(ext);

	return (
		<div className="flex flex-col items-center gap-1">
			<Icon className={ICON_CLASS} strokeWidth={1.25} />
			<span className="max-w-16 truncate font-medium text-[10px] text-muted-foreground uppercase">
				{ext}
			</span>
		</div>
	);
};

interface FilePreviewGridProps {
	files: File[];
	onRemoveFile: (index: number) => void;
}

export const FilePreviewGrid = ({
	files,
	onRemoveFile,
}: FilePreviewGridProps) => {
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

	if (files.length === 0) return null;

	return (
		<ScrollArea type="always">
			{/* pb-3 is for scroll bar, it's up to the caller to make this look decent */}
			<div className="flex w-max gap-2 pb-3">
				{files.map((file, idx) => {
					const key = `${file.name}-${file.size}-${file.lastModified}-${idx}`;
					const previewUrl = previewUrls.get(
						`${file.name}-${file.size}-${file.lastModified}`,
					);

					return (
						<Tooltip key={key}>
							<TooltipTrigger asChild>
								<div className="group relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
									{previewUrl ? (
										<img
											src={previewUrl}
											alt={file.name}
											className="size-full object-cover"
										/>
									) : (
										getFileIcon(file)
									)}
									<Button
										variant="destructive"
										size="icon"
										className="absolute end-1 top-1 size-5 opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
										aria-label={`Remove ${file.name}`}
										onClick={() => onRemoveFile(idx)}
									>
										<XIcon className="size-3" />
									</Button>
								</div>
							</TooltipTrigger>
							<TooltipContent>
								<p className="max-w-48 truncate text-xs">
									{file.name}
								</p>
								<p className="text-muted-foreground text-xs">
									{(file.size / 1024).toFixed(1)} KB
								</p>
							</TooltipContent>
						</Tooltip>
					);
				})}
			</div>
			<ScrollBar orientation="horizontal" className="-mr-2" />
		</ScrollArea>
	);
};
