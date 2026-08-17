import { FileIcon, ImageIcon, XIcon } from "lucide-react";
import { useEffect, useMemo } from "react";
import {
	Button,
	ScrollArea,
	ScrollBar,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";

interface WorkbenchChatAttachmentsProps {
	files: File[];
	onRemove: (index: number) => void;
}

/** Preview files waiting to be uploaded with the next room message. */
export const WorkbenchChatAttachments = ({
	files,
	onRemove,
}: WorkbenchChatAttachmentsProps) => {
	const previewUrls = useMemo(() => {
		const urls = new Map<string, string>();
		for (const file of files) {
			if (!file.type.startsWith("image/")) {
				continue;
			}
			const key = `${file.name}-${file.size}-${file.lastModified}`;
			urls.set(key, URL.createObjectURL(file));
		}
		return urls;
	}, [files]);

	useEffect(
		() => () => {
			for (const url of previewUrls.values()) {
				URL.revokeObjectURL(url);
			}
		},
		[previewUrls],
	);

	if (files.length === 0) {
		return null;
	}

	return (
		<ScrollArea className="w-full">
			<div className="flex w-max gap-2 px-3 pt-3 pb-2">
				{files.map((file, index) => {
					const key = `${file.name}-${file.size}-${file.lastModified}`;
					const previewUrl = previewUrls.get(key);
					return (
						<Tooltip key={key}>
							<TooltipTrigger asChild>
								<div className="group relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
									{previewUrl ? (
										<img
											src={previewUrl}
											alt={file.name}
											className="size-full object-cover"
										/>
									) : (
										<div className="flex min-w-0 flex-col items-center gap-1 px-1 text-muted-foreground">
											{file.type.startsWith("image/") ? (
												<ImageIcon className="size-5" />
											) : (
												<FileIcon className="size-5" />
											)}
											<span className="w-10 truncate text-center text-[10px]">
												{file.name}
											</span>
										</div>
									)}
									<Button
										type="button"
										variant="destructive"
										size="icon-sm"
										className="absolute top-1 right-1 size-5 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
										aria-label={`Remove ${file.name}`}
										onClick={() => onRemove(index)}
									>
										<XIcon className="size-3" />
									</Button>
								</div>
							</TooltipTrigger>
							<TooltipContent>
								<p className="max-w-48 truncate">{file.name}</p>
								<p className="text-muted-foreground text-xs">
									{(file.size / 1024).toFixed(1)} KB
								</p>
							</TooltipContent>
						</Tooltip>
					);
				})}
			</div>
			<ScrollBar orientation="horizontal" />
		</ScrollArea>
	);
};
