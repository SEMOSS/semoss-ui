import { ChevronDown } from "lucide-react";
import { useId, useState } from "react";
import { usePixel } from "@semoss/sdk/react";
import { AppCatalogAvatar, EngineSubtypeIcon } from "@semoss/shared";
import {
	Button,
	Command,
	CommandInput,
	CommandItem,
	CommandList,
	Field,
	FieldError,
	FieldLabel,
	FormField,
	Muted,
	Popover,
	PopoverContent,
	PopoverTrigger,
	useDebouncedValue,
	useFormContext,
} from "@semoss/ui/next";
import { parseUsageFilterOptions } from "@/api/enterprise-usage";
import { usageFilterOptionsPixel } from "@/api/enterprise-usage-requests";
import type {
	UsageEntity,
	UsageFilterDimension,
	UsageFilterOptions,
	UsageFilters,
} from "./usage.types";

interface UsageEntityPickerProps {
	/** Exact identity filter owned by the surrounding report form. */
	dimension: UsageFilterDimension;
}
const labels = { user: "User", app: "App", engine: "Engine" };

/** Searchable, server-paged identity choices; choices join the date filter draft until Apply Filters. */
export function UsageEntityPicker({ dimension }: UsageEntityPickerProps) {
	const form = useFormContext<UsageFilters>();
	const value = form.watch(dimension);
	const id = value.startsWith("=") ? value.slice(1) : value;
	const label = labels[dimension];
	const triggerId = useId();
	const listId = useId();
	const [isOpen, setIsOpen] = useState(false);
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(0);
	const debounced = useDebouncedValue(search);
	let pixel = "";
	let validationError = "";
	try {
		usageFilterOptionsPixel(dimension, search, page);
		if (isOpen) pixel = usageFilterOptionsPixel(dimension, debounced, page);
	} catch (error) {
		validationError =
			error instanceof Error ? error.message : "Invalid Search";
	}
	const choices = usePixel<unknown>(pixel);
	let selectedPixel = "";
	try {
		if (id) selectedPixel = usageFilterOptionsPixel(dimension, "", 0, id);
	} catch {
		/* The form reports unsupported identity characters on apply. */
	}
	const selected = usePixel<unknown>(selectedPixel);
	let options: UsageFilterOptions = { rows: [], hasMore: false };
	let selectedEntity: UsageEntity = { id, name: id, type: "", subtype: "" };
	let selectedLabel = id;
	let error = validationError || choices.error?.message || "";
	let selectedError = selected.error?.message || "";
	try {
		if (choices.status === "SUCCESS")
			options = parseUsageFilterOptions(choices.data);
	} catch (failure) {
		error =
			failure instanceof Error
				? failure.message
				: "Unable To Load Options";
	}
	try {
		if (selected.status === "SUCCESS") {
			const matches = parseUsageFilterOptions(selected.data).rows;
			if (matches.length) {
				selectedEntity = matches[0];
				selectedLabel = `${matches[0].name} | ${id}${dimension === "user" ? ` | ${[...new Set(matches.map((row) => row.type || "Unknown Type"))].join(", ")}` : ""}`;
			}
		}
	} catch (failure) {
		selectedError =
			failure instanceof Error
				? failure.message
				: "Unable To Resolve Selection";
	}
	const isLoading =
		Boolean(pixel) &&
		(debounced !== search ||
			choices.status === "LOADING" ||
			choices.status === "INITIAL");
	const renderEntityImage = (entity: UsageEntity) => {
		if (dimension === "app")
			return (
				<AppCatalogAvatar
					projectId={entity.id}
					name={entity.name}
					className="size-6 shrink-0 rounded text-xs"
				/>
			);
		if (dimension === "engine")
			return (
				<EngineSubtypeIcon
					engineType={entity.type}
					engineSubtype={entity.subtype}
					alt=""
					className="size-6 shrink-0 object-contain"
				/>
			);
		return null;
	};
	return (
		<FormField
			control={form.control}
			name={dimension}
			render={({ field, fieldState }) => (
				<Field
					className="min-w-0"
					data-invalid={Boolean(fieldState.error)}
				>
					<FieldLabel htmlFor={triggerId}>{label}</FieldLabel>
					<Popover open={isOpen} onOpenChange={setIsOpen}>
						<PopoverTrigger asChild>
							<Button
								ref={field.ref}
								id={triggerId}
								type="button"
								variant="outline"
								role="combobox"
								aria-expanded={isOpen}
								aria-controls={listId}
								aria-invalid={Boolean(fieldState.error)}
								onBlur={field.onBlur}
								className="h-auto min-h-9 w-full justify-between whitespace-normal text-left"
							>
								<span className="flex min-w-0 flex-1 items-center gap-2">
									{id && renderEntityImage(selectedEntity)}
									<span className="min-w-0 break-words text-xs">
										{id ? selectedLabel : `All ${label}s`}
									</span>
								</span>
								<ChevronDown
									className="shrink-0"
									aria-hidden="true"
								/>
							</Button>
						</PopoverTrigger>
						<PopoverContent
							align="start"
							className="w-80 max-w-[calc(100vw-2rem)] p-0"
						>
							<Command shouldFilter={false}>
								<CommandInput
									aria-label={`Search ${label}s By Name Or ID`}
									placeholder="Search Name Or ID"
									value={search}
									maxLength={255}
									onValueChange={(next) => {
										setSearch(next);
										setPage(0);
									}}
								/>
								<CommandList
									id={listId}
									aria-label={`${label} Choices`}
								>
									<CommandItem
										value="all"
										onSelect={() => {
											field.onChange("");
											setIsOpen(false);
										}}
									>
										All {label}s
									</CommandItem>
									{isLoading ? (
										<output className="block p-3 text-sm">
											Loading Choices...
										</output>
									) : error ? (
										<div
											role="alert"
											className="p-3 text-sm"
										>
											{error}{" "}
											<Button
												type="button"
												variant="link"
												onClick={choices.refresh}
											>
												Retry
											</Button>
										</div>
									) : (
										<>
											{!options.rows.length && (
												<Muted className="block p-3 text-sm">
													No Registered Matches
												</Muted>
											)}
											{options.rows.map((option) => (
												<CommandItem
													key={`${option.id}-${option.type}`}
													value={`${option.id}-${option.type}`}
													onSelect={() => {
														field.onChange(
															`=${option.id}`,
														);
														setIsOpen(false);
													}}
													className="min-h-11 items-center"
												>
													{renderEntityImage(option)}
													<span className="min-w-0 break-words">
														<span className="block font-medium">
															{option.name}
														</span>
														<span className="block text-muted-foreground text-xs">
															ID: {option.id}
															{dimension ===
															"user"
																? ` | Type: ${option.type || "Unknown"}`
																: ""}
														</span>
													</span>
												</CommandItem>
											))}
										</>
									)}
									{search.trim() && !validationError && (
										<CommandItem
											value="manual-id"
											onSelect={() => {
												field.onChange(
													`=${search.trim()}`,
												);
												setIsOpen(false);
											}}
										>
											Use Exact ID: {search.trim()}
										</CommandItem>
									)}
								</CommandList>
							</Command>
							<div className="flex items-center justify-between border-t p-2">
								<Button
									type="button"
									size="sm"
									variant="ghost"
									disabled={isLoading || page === 0}
									onClick={() =>
										setPage((current) => current - 1)
									}
								>
									Previous Choices
								</Button>
								<Button
									type="button"
									size="sm"
									variant="ghost"
									disabled={
										isLoading ||
										Boolean(error) ||
										!options.hasMore
									}
									onClick={() =>
										setPage((current) => current + 1)
									}
								>
									Next Choices
								</Button>
							</div>
							{dimension === "user" && (
								<Muted className="block px-3 pb-2 text-xs">
									Usage Matches The User ID Across
									Authentication Types.
								</Muted>
							)}
						</PopoverContent>
					</Popover>
					{selectedError && id && (
						<Muted className="text-xs">
							Name Unavailable; Filtering By ID.
						</Muted>
					)}
					{fieldState.error && (
						<FieldError>{fieldState.error.message}</FieldError>
					)}
				</Field>
			)}
		/>
	);
}
