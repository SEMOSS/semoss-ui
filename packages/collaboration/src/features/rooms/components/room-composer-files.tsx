import { FileText, X } from "lucide-react";
import { useEffect, useMemo } from "react";
import {
	Button,
	ScrollArea,
	ScrollBar,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";

function fileKey(file: File, index?: number) {
	return `${file.name}-${file.size}-${file.lastModified}${index ?? ""}`;
}

/** Preview selected composer files with keyboard- and touch-accessible removal. */
export function RoomComposerFiles({
	files,
	onRemove,
}: {
	files: File[];
	onRemove: (index: number) => void;
}) {
	const previews = useMemo(() => {
		const urls = new Map<string, string>();
		for (const file of files) {
			if (!file.type.startsWith("image/")) continue;
			urls.set(fileKey(file), URL.createObjectURL(file));
		}
		return urls;
	}, [files]);

	useEffect(
		() => () => {
			for (const url of previews.values()) URL.revokeObjectURL(url);
		},
		[previews],
	);

	if (files.length === 0) return null;

	return (
		<ScrollArea type="always" className="border-b bg-card px-3 pt-3">
			<div className="flex w-max gap-2 pb-4">
				{files.map((file, index) => {
					const preview = previews.get(fileKey(file));
					return (
						<div
							key={fileKey(file, index)}
							className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted"
						>
							{preview ? (
								<img
									src={preview}
									alt={file.name}
									className="size-full object-cover"
								/>
							) : (
								<span className="flex min-w-0 flex-col items-center gap-1 px-2 text-muted-foreground">
									<FileText
										aria-hidden="true"
										className="size-7"
									/>
									<span className="max-w-full truncate text-xs">
										{file.name}
									</span>
								</span>
							)}
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										type="button"
										variant="destructive"
										size="icon-sm"
										className="absolute top-1 right-1 min-h-11 min-w-11 sm:min-h-8 sm:min-w-8"
										aria-label={`Remove ${file.name}`}
										onClick={() => onRemove(index)}
									>
										<X aria-hidden="true" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>
									Remove {file.name}
								</TooltipContent>
							</Tooltip>
						</div>
					);
				})}
			</div>
			<ScrollBar orientation="horizontal" />
		</ScrollArea>
	);
}
