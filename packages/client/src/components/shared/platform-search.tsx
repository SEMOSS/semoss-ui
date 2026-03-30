import { SearchIcon } from "lucide-react";
import React, { Suspense, useEffect, useState } from "react";
import {
	Badge,
	Button,
	Command,
	CommandEmpty,
	CommandInput,
	CommandList,
	CommandSeparator,
	cn,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	useDebouncedValue,
} from "@semoss/ui/next";
import { PlatformSearchApp } from "./platform-search-app";
import { PlatformSearchEngine } from "./platform-search-engine";

type SearchCategoryType =
	| "PROJECT"
	| "DATABASE"
	| "FUNCTION"
	| "GUARDRAIL"
	| "MODEL"
	| "STORAGE"
	| "VECTOR";

// Categories we can search
const CATEGORIES = [
	{ name: "Apps", type: "PROJECT" },
	{ name: "Database", type: "DATABASE" },
	{ name: "Function", type: "FUNCTION" },
	{ name: "Guardrail", type: "GUARDRAIL" },
	{ name: "Model", type: "MODEL" },
	{ name: "Storage", type: "STORAGE" },
	{ name: "Vector", type: "VECTOR" },
] as const satisfies ReadonlyArray<{ name: string; type: SearchCategoryType }>;

interface PromptSearchProps {
	/** Css to pass to the toggle */
	className?: string;
}

export const PlatformSearch = ({ className }: PromptSearchProps) => {
	const [search, setSearch] = useState("");
	const [open, setOpen] = useState(false);

	const debouncedSearch = useDebouncedValue(search);

	const [isAll, setIsAll] = useState(true);
	const [selectedCategories, setSelectedCategories] = useState<
		Record<string, boolean>
	>({});

	const renderedCategories = CATEGORIES.filter(
		(c) => isAll || selectedCategories[c.type],
	);

	// Add keyboard shortcut: Cmd+K (Mac) or Ctrl+K (Windows/Linux)
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Check for Cmd+K (Mac) or Ctrl+K (Windows/Linux)
			if ((e.metaKey || e.ctrlKey) && e.key === "k") {
				// Don't trigger if user is typing in an input/textarea
				const target = e.target as HTMLElement;
				if (
					target.tagName === "INPUT" ||
					target.tagName === "TEXTAREA" ||
					target.isContentEditable
				) {
					return;
				}

				// Prevent default browser behavior
				e.preventDefault();

				// Toggle the search dialog
				setOpen((prev) => !prev);
			}
		};

		window.addEventListener("keydown", handleKeyDown);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, []);

	return (
		<>
			<Button
				variant="outline"
				className={cn(
					"h-10 w-full justify-start overflow-hidden rounded-lg border-2 border-border bg-background/95 text-muted-foreground shadow-sm hover:text-foreground",
					className,
				)}
				onClick={() => setOpen(true)}
			>
				<SearchIcon className="size-4 shrink-0 opacity-50" />
				Search
			</Button>
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent
					className="overflow-hidden p-0 sm:max-w-2xl [&>[data-slot=dialog-close]]:z-20 [&>[data-slot=dialog-close]]:rounded-md [&>[data-slot=dialog-close]]:bg-background/95 [&>[data-slot=dialog-close]]:p-1"
					showCloseButton={true}
				>
					<DialogHeader className="sr-only">
						<DialogTitle>Command</DialogTitle>
						<DialogDescription>
							Run a platform command
						</DialogDescription>
					</DialogHeader>
					<Command
						className="bg-background **:data-[slot=command-input-wrapper]:h-12 [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-1 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:rounded-md [&_[cmdk-item]]:px-2.5 [&_[cmdk-item]]:py-2.5 [&_[cmdk-item]_svg]:h-4.5 [&_[cmdk-item]_svg]:w-4.5 [&_[data-slot=command-input-wrapper]]:mx-3 [&_[data-slot=command-input-wrapper]]:my-3 [&_[data-slot=command-input-wrapper]]:rounded-md [&_[data-slot=command-input-wrapper]]:border [&_[data-slot=command-input-wrapper]]:border-border [&_[data-slot=command-input-wrapper]]:border-b [&_[data-slot=command-input-wrapper]]:bg-background [&_[data-slot=command-input-wrapper]]:shadow-sm"
						shouldFilter={false}
					>
						<div className="border-b bg-muted/20 p-3 pr-14">
							<div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-9">
								<Badge
									variant={isAll ? "default" : "outline"}
									className={cn(
										"h-8 w-full cursor-pointer justify-center rounded-md border-border text-[11px] transition-colors",
										!isAll &&
											"bg-background hover:bg-accent",
										isAll && "shadow-sm",
									)}
									asChild
								>
									<button
										type="button"
										onClick={() => {
											const updated = !isAll;

											// if selected, clear existing categories
											if (updated) {
												setSelectedCategories({});
											}

											setIsAll(updated);
										}}
									>
										All
									</button>
								</Badge>

								{CATEGORIES.map((c) => {
									const isSelected =
										selectedCategories[c.type];

									return (
										<Badge
											key={c.type}
											variant={
												isSelected
													? "default"
													: "outline"
											}
											className={cn(
												"h-8 w-full cursor-pointer justify-center rounded-md border-border text-[11px] transition-colors",
												!isSelected &&
													"bg-background hover:bg-accent",
												isSelected && "shadow-sm",
											)}
											asChild
										>
											<button
												type="button"
												onClick={() => {
													// if it is already selected, unselect it and check if all should be set
													if (isSelected) {
														setSelectedCategories(
															(prev) => {
																const updated =
																	{
																		...prev,
																	};
																delete updated[
																	c.type
																];

																// if there is nothing selected, select everything
																if (
																	Object.keys(
																		updated,
																	).length ===
																	0
																) {
																	setIsAll(
																		true,
																	);
																}
																return updated;
															},
														);
													} else {
														setSelectedCategories(
															(prev) => ({
																...prev,
																[c.type]: true,
															}),
														);
														setIsAll(false);
													}
												}}
											>
												{c.name}
											</button>
										</Badge>
									);
								})}
							</div>
						</div>

						<CommandInput
							placeholder="Search apps, engines, and tools"
							value={search}
							onValueChange={(s) => setSearch(s)}
							autoFocus={true}
						/>

						<CommandList className="max-h-[420px] p-2">
							<Suspense
								fallback={
									<CommandEmpty>Loading...</CommandEmpty>
								}
							>
								<CommandEmpty>No results found</CommandEmpty>
								{renderedCategories.map((c) => {
									if (c.type === "PROJECT") {
										return (
											<React.Fragment key={c.type}>
												<PlatformSearchApp
													name={c.name}
													search={debouncedSearch}
													onSelect={() => {
														setOpen(false);
													}}
												/>
												<CommandSeparator />
											</React.Fragment>
										);
									}

									return (
										<React.Fragment key={c.type}>
											<PlatformSearchEngine
												name={c.name}
												type={c.type}
												search={debouncedSearch}
												onSelect={() => {
													setOpen(false);
												}}
											/>
											<CommandSeparator />
										</React.Fragment>
									);
								})}
							</Suspense>
						</CommandList>
					</Command>
				</DialogContent>
			</Dialog>
		</>
	);
};
