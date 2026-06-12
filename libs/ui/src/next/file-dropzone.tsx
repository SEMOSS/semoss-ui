import { Upload, X } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

interface FileDropzoneProps {
	multiple?: boolean;
	value?: File | File[] | null;
	onChange?: (value: File | File[] | null) => void;
	disabled?: boolean;
	extensions?: string[];
	description?: string;
	className?: string;
}

const FileDropzone = React.forwardRef<HTMLDivElement, FileDropzoneProps>(
	(
		{
			multiple = false,
			value,
			onChange,
			disabled = false,
			extensions = [],
			description = "Click to browse or drop a file",
			className,
		},
		ref,
	) => {
		const inputRef = React.useRef<HTMLInputElement>(null);
		const [dragging, setDragging] = React.useState(false);

		const files: File[] = React.useMemo(() => {
			if (!value) return [];
			return Array.isArray(value) ? value : [value];
		}, [value]);

		const accept = extensions.length ? extensions.join(",") : undefined;

		const processFiles = (incoming: FileList | File[]) => {
			const list = Array.from(incoming).filter((f) => {
				if (!extensions.length) return true;
				const ext = `.${f.name.split(".").pop()?.toLowerCase()}`;
				return extensions.some(
					(e) =>
						e.toLowerCase() === ext ||
						e.toLowerCase() === ext.slice(1),
				);
			});

			if (!list.length) return;

			if (multiple) {
				const merged = [...files, ...list].filter(
					(f, i, arr) =>
						arr.findIndex((x) => x.name === f.name) === i,
				);
				onChange?.(merged);
			} else {
				onChange?.(list[0]);
			}
		};

		const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
			if (e.target.files) processFiles(e.target.files);
			e.target.value = "";
		};

		const handleDrop = (e: React.DragEvent) => {
			e.preventDefault();
			setDragging(false);
			if (disabled) return;
			processFiles(e.dataTransfer.files);
		};

		const removeFile = (name: string) => {
			if (multiple) {
				const next = (files as File[]).filter((f) => f.name !== name);
				onChange?.(next.length ? next : null);
			} else {
				onChange?.(null);
			}
		};

		return (
			<div ref={ref} className={cn("flex flex-col gap-2", className)}>
				<button
					type="button"
					disabled={disabled}
					onClick={() => inputRef.current?.click()}
					onDragEnter={(e) => {
						e.preventDefault();
						if (!disabled) setDragging(true);
					}}
					onDragOver={(e) => {
						e.preventDefault();
					}}
					onDragLeave={(e) => {
						e.preventDefault();
						setDragging(false);
					}}
					onDrop={handleDrop}
					className={cn(
						"flex w-full flex-col items-center justify-center gap-1 rounded-md border border-dashed px-4 py-5 text-sm transition-colors",
						dragging
							? "border-primary bg-primary/5 text-primary"
							: "border-border text-muted-foreground hover:border-primary hover:text-foreground",
						disabled && "pointer-events-none opacity-50",
					)}
				>
					<Upload className="size-5" />
					<span>{description}</span>
					<input
						ref={inputRef}
						type="file"
						accept={accept}
						multiple={multiple}
						disabled={disabled}
						className="hidden"
						onChange={handleInput}
					/>
				</button>

				{files.length > 0 && (
					<ul className="flex flex-col gap-1">
						{files.map((f) => (
							<li
								key={f.name}
								className="flex min-w-0 items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-1.5 text-sm"
							>
								<span className="truncate">{f.name}</span>
								{!disabled && (
									<button
										type="button"
										onClick={() => removeFile(f.name)}
										className="ms-2 shrink-0 rounded p-0.5 hover:bg-accent"
										aria-label={`Remove ${f.name}`}
									>
										<X className="size-3.5 text-muted-foreground" />
									</button>
								)}
							</li>
						))}
					</ul>
				)}
			</div>
		);
	},
);

FileDropzone.displayName = "FileDropzone";

export { FileDropzone, type FileDropzoneProps };
