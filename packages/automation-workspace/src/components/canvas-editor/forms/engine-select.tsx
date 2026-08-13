import { CheckIcon, ChevronDown } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useIteratorPixel, usePixel } from "@semoss/sdk/react";
import type { Engine } from "@semoss/shared";
import { EngineSubtypeIcon } from "@semoss/shared";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Spinner,
	useDebouncedValue,
	useInfiniteScroll,
} from "@semoss/ui/next";

const SUBTYPE_LABELS: Record<string, string> = {
	OPEN_AI: "OpenAI",
	ANTHROPIC: "Anthropic",
	HUGGING_FACE: "Hugging Face",
	PALM: "PaLM",
	GEMINI: "Gemini",
	AZURE: "Azure OpenAI",
	NER: "Named entity recognition",
	KSERVE_VISION: "Vision",
	TEXT_GENERATION: "Text generation",
	TEXT_EMBEDDINGS: "Text embeddings",
	POSTGRES: "PostgreSQL",
	MYSQL: "MySQL",
	MSSQL: "SQL Server",
	SQLITE: "SQLite",
	SNOWFLAKE: "Snowflake",
	S3: "Amazon S3",
	GCS: "Google Cloud Storage",
	SHAREPOINT: "SharePoint",
};

function formatSubtype(s: string): string {
	return (
		SUBTYPE_LABELS[s] ??
		s
			.toLowerCase()
			.replace(/_/g, " ")
			.replace(/^\w/, (c) => c.toUpperCase())
	);
}

interface AutomationEngineSelectProps {
	/** Display name shown on the closed trigger */
	name: string;
	/** Currently selected engine ID */
	value: string;
	/** Restrict the list to these engine types */
	engineTypes?: Engine["engine_type"][];
	/** Called when the user picks an engine */
	onChange: (engine: Engine) => void;
	disabled?: boolean;
}

export function AutomationEngineSelect({
	name,
	value,
	engineTypes,
	onChange,
	disabled,
}: AutomationEngineSelectProps) {
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState("");

	// When an engine ID is already set (e.g. from AI generation) but the display
	// name wasn't persisted, resolve it via a one-shot pixel call.
	const { data: resolvedEngines } = usePixel<Engine[] | null>(
		value && !name
			? `META | MyEngines(engine=["${value}"], limit=[1], offset=[0]);`
			: "",
		{ data: null },
	);
	const resolvedName = resolvedEngines?.[0]
		? resolvedEngines[0].engine_display_name ||
			resolvedEngines[0].engine_name ||
			""
		: "";
	const debouncedSearch = useDebouncedValue(search);

	const getEngines = useIteratorPixel<Engine[], Engine>(
		(limit, offset) =>
			open
				? `META | MyEngines(${
						debouncedSearch
							? `filterWord=${JSON.stringify(debouncedSearch)}, `
							: ""
					} ${
						engineTypes
							? `engineTypes=${JSON.stringify(engineTypes)},`
							: ""
					} limit=[${limit}], offset=[${offset}]);`
				: "",
		(response) => (response.length === 0 ? -1 : Infinity),
		(response) => response,
		{ limit: 15 },
		[open, debouncedSearch, JSON.stringify(engineTypes)],
	);

	const nextRef = useRef(getEngines.next);
	useEffect(() => {
		nextRef.current = getEngines.next;
	}, [getEngines.next]);
	const handleNext = useCallback(() => {
		nextRef.current();
	}, []);

	const { setScroll } = useInfiniteScroll({
		disabled: getEngines.isLoading || !getEngines.hasMore || !open,
		onNext: handleNext,
	});
	const listRef = useCallback(
		(node: HTMLDivElement | null) => {
			setScroll(node);
		},
		[setScroll],
	);

	return (
		<Popover open={open && !disabled} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<button
					type="button"
					role="combobox"
					aria-expanded={open}
					disabled={disabled}
					className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
				>
					<span className="truncate text-left">
						{name || resolvedName || "Select engine…"}
					</span>
					<ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</button>
			</PopoverTrigger>
			<PopoverContent className="w-[var(--radix-popover-trigger-width)] min-w-64 p-0">
				<Command shouldFilter={false}>
					<CommandInput
						placeholder="Search"
						value={search}
						onValueChange={setSearch}
					/>
					<CommandList ref={listRef}>
						<CommandEmpty>
							{getEngines.isLoading &&
							getEngines.data.length === 0 ? (
								<div className="flex items-center justify-center py-4">
									<Spinner />
								</div>
							) : (
								"Not Found"
							)}
						</CommandEmpty>
						<CommandGroup>
							{getEngines.data.map((engine) => {
								const displayName =
									engine.engine_display_name ||
									engine.engine_name;
								return (
									<CommandItem
										key={engine.engine_id}
										value={engine.engine_id}
										onSelect={() => {
											onChange(engine);
											setOpen(false);
										}}
										className={
											value === engine.engine_id
												? "bg-primary/10 data-[selected=true]:bg-primary/15"
												: undefined
										}
									>
										<EngineSubtypeIcon
											engineType={engine.engine_type}
											engineSubtype={
												engine.engine_subtype
											}
											alt={`${displayName} icon`}
											className="me-2 size-6 shrink-0 object-contain"
										/>
										<div className="flex flex-1 flex-col truncate">
											<span className="truncate">
												{displayName}
											</span>
											{engine.engine_subtype && (
												<span className="truncate text-[10px] text-muted-foreground">
													{formatSubtype(
														engine.engine_subtype,
													)}
												</span>
											)}
										</div>
										{value === engine.engine_id && (
											<CheckIcon
												strokeWidth={3}
												className="ms-2 size-4 shrink-0 text-primary"
											/>
										)}
									</CommandItem>
								);
							})}
							{getEngines.isLoading &&
								getEngines.data.length > 0 && (
									<div className="flex items-center justify-center py-2">
										<Spinner className="size-4" />
									</div>
								)}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
