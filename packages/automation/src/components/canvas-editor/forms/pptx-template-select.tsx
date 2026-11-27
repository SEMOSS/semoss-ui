import { CheckIcon, ChevronDown } from "lucide-react";
import { useId, useState } from "react";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	Field,
	FieldDescription,
	FieldLabel,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Spinner,
} from "@semoss/ui/next";
import {
	type PptxTemplateFile,
	usePptxTemplateFiles,
} from "../../../hooks/use-pptx-template-files";

interface PptxTemplateSelectProps {
	/** The selected template path, relative to the run's files or project assets */
	value: string;
	/** Called with the chosen template path */
	onChange: (path: string) => void;
	/** The automation's project, whose assets are searched */
	appId: string;
	/** The insight of the run whose files are searched alongside the project assets */
	runInsightId?: string;
	disabled?: boolean;
}

const GROUP_HEADINGS = {
	project: "Project Assets",
	run: "Run Files",
} as const;

/** Keeps the files whose name or path contains the search text. */
function matchFiles(files: PptxTemplateFile[], search: string) {
	const query = search.trim().toLowerCase();
	if (!query) return files;
	return files.filter((file) => file.path.toLowerCase().includes(query));
}

/**
 * Searchable picker for the .pptx template of a TemplatePPTX step. Lists the
 * templates in the project assets and in the files of the run being shown; a path
 * or `${variable}` that is not listed can still be typed and used.
 */
export function PptxTemplateSelect({
	value,
	onChange,
	appId,
	runInsightId,
	disabled,
}: PptxTemplateSelectProps) {
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState("");
	const triggerId = useId();
	const templates = usePptxTemplateFiles(appId, runInsightId, open);

	const typed = search.trim();
	const groups = (["run", "project"] as const)
		.map((source) => ({
			source,
			state: templates[source],
			files: matchFiles(templates[source].files, search),
		}))
		.filter(({ source, state }) =>
			source === "run"
				? Boolean(runInsightId) || state.error
				: Boolean(appId) || state.error,
		);
	const isLoading = groups.some(({ state }) => state.isLoading);
	const hasMatch = groups.some(({ files }) =>
		files.some((file) => file.path === typed),
	);

	const handleSelect = (path: string) => {
		onChange(path);
		setOpen(false);
		setSearch("");
	};

	return (
		<Field>
			<FieldLabel htmlFor={triggerId}>Template File</FieldLabel>
			<Popover
				open={open && !disabled}
				onOpenChange={(next) => {
					setOpen(next);
					if (!next) setSearch("");
				}}
			>
				<PopoverTrigger asChild>
					<button
						id={triggerId}
						type="button"
						role="combobox"
						aria-expanded={open}
						disabled={disabled}
						className="flex h-9 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
					>
						<span className="flex-1 truncate text-left">
							{value || (
								<span className="text-muted-foreground">
									Select a template…
								</span>
							)}
						</span>
						<ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
					</button>
				</PopoverTrigger>
				<PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-64 p-0">
					<Command shouldFilter={false}>
						<CommandInput
							placeholder="Search templates…"
							value={search}
							onValueChange={setSearch}
						/>
						<CommandList>
							<CommandEmpty>
								{isLoading ? (
									<div className="flex items-center justify-center py-4">
										<Spinner />
									</div>
								) : (
									"No templates found"
								)}
							</CommandEmpty>
							{typed && !hasMatch && (
								<CommandGroup heading="Custom Path">
									<CommandItem
										value={`custom:${typed}`}
										onSelect={() => handleSelect(typed)}
									>
										<span className="truncate">
											Use "{typed}"
										</span>
									</CommandItem>
								</CommandGroup>
							)}
							{groups.map(({ source, state, files }) => (
								<CommandGroup
									key={source}
									heading={GROUP_HEADINGS[source]}
								>
									{state.error && (
										<p
											role="alert"
											className="px-2 py-1.5 text-destructive text-xs"
										>
											Could not search{" "}
											{GROUP_HEADINGS[
												source
											].toLowerCase()}
											.
										</p>
									)}
									{files.map((file) => (
										<CommandItem
											key={`${file.source}:${file.path}`}
											value={`${file.source}:${file.path}`}
											onSelect={() =>
												handleSelect(file.path)
											}
										>
											<div className="flex flex-1 flex-col truncate">
												<span className="truncate">
													{file.name}
												</span>
												{file.path !== file.name && (
													<span className="truncate text-muted-foreground text-xs">
														{file.path}
													</span>
												)}
											</div>
											{value === file.path && (
												<CheckIcon
													strokeWidth={3}
													className="ms-2 size-4 shrink-0 text-primary"
												/>
											)}
										</CommandItem>
									))}
									{state.isLoading && files.length > 0 && (
										<div className="flex items-center justify-center py-2">
											<Spinner className="size-4" />
										</div>
									)}
								</CommandGroup>
							))}
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>
			<FieldDescription>
				A .pptx file in the project assets or in the files of the
				selected run. Type a path or {"$"}
				{"{variable}"} to use one that is not listed.
			</FieldDescription>
		</Field>
	);
}
