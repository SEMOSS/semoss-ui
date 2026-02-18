import { ChevronDown, Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Env, useDebouncedValue, usePixel } from "@semoss/sdk/react";
import {
	Badge,
	Button,
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Muted,
	P,
	Popover,
	PopoverContent,
	PopoverTrigger,
	toast,
} from "@semoss/ui/next";
import { useRootStore } from "@/hooks";
import {
	type modelledDependency,
	SetProjectDependencies,
} from "./app-details.utility";

interface EditDependenciesModalProps {
	isOpen: boolean;
	onClose: (refresh: boolean) => void;
	appId: string;
	currentDependencies: modelledDependency[];
}

interface MyEngineProjectEngine {
	app_id: string;
	app_name: string;
	app_type: string;
}

interface MyEngineProjectProject {
	project_id: string;
	project_name: string;
}

interface Dependency {
	id: string;
	name: string;
	type: string;
}

/**
 * Capitalizes the first letter of each word in a string
 */
const capitalizeType = (type: string): string => {
	return type
		.toLowerCase()
		.split("_")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");
};

/**
 * Renders a modal to edit dependencies for an application.
 *
 * @component
 */
export const EditDependenciesModal = ({
	isOpen,
	onClose,
	appId,
	currentDependencies,
}: EditDependenciesModalProps) => {
	/**
	 * State
	 */
	const [allDeps, setAllDeps] = useState<Dependency[]>([]);
	const [selectedDeps, setSelectedDeps] =
		useState<Dependency[]>(currentDependencies);
	const [search, setSearch] = useState<string>("");
	const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);

	/**
	 * Library Hooks
	 */
	const { configStore } = useRootStore();
	const debouncedSearch = useDebouncedValue(search);
	const getEngines = usePixel<
		(MyEngineProjectEngine | MyEngineProjectProject)[]
	>(
		`MyEngineProject(filterWord=${JSON.stringify(debouncedSearch ?? "")});`,
		undefined,
		configStore.store.insightID,
	);

	/**
	 * Functions
	 */
	const handleUpdateDependencies = async () => {
		const res = await SetProjectDependencies(
			configStore,
			appId,
			selectedDeps.map((dep: modelledDependency) => ({
				id: dep.id,
				type: dep.type,
			})),
		);

		if (res.type === "success") {
			toast.success("Successfully updated dependencies");
			handleClose(true);
		} else {
			toast.error(res.output);
		}
	};

	const handleRemoveDependency = (id: string) => {
		const newDependencies = selectedDeps.filter(
			(dep: modelledDependency) => dep.id !== id,
		);
		setSelectedDeps(newDependencies);
	};

	const handleToggleDependency = (dep: Dependency) => {
		const isSelected = selectedDeps.some((d) => d.id === dep.id);
		if (isSelected) {
			setSelectedDeps(selectedDeps.filter((d) => d.id !== dep.id));
		} else {
			setSelectedDeps([...selectedDeps, dep]);
		}
		setDropdownOpen(false);
	};

	const handleClose = (refresh: boolean) => {
		// Reset search when closing
		setSearch("");
		setDropdownOpen(false);
		if (!refresh) {
			setSelectedDeps(currentDependencies);
		}
		onClose(refresh);
	};

	/**
	 * Effects
	 */
	useEffect(() => {
		if (getEngines.status !== "SUCCESS") {
			return;
		}

		setAllDeps(
			getEngines.data.map((engineProject) => {
				const eng = engineProject as MyEngineProjectEngine;
				const proj = engineProject as MyEngineProjectProject;
				if (eng.app_id) {
					return {
						id: eng.app_id,
						name: eng.app_name,
						type: eng.app_type,
					};
				}
				if (proj.project_id) {
					return {
						id: proj.project_id,
						name: proj.project_name,
						type: "PROJECT",
					};
				}
				return null;
			}),
		);
	}, [getEngines.status, getEngines.data]);

	useEffect(() => {
		setSelectedDeps(currentDependencies);
	}, [currentDependencies]);

	// Reset state when modal opens/closes
	useEffect(() => {
		if (isOpen) {
			// Reset to current dependencies when modal opens
			setSelectedDeps(currentDependencies);
			setSearch("");
			setDropdownOpen(false);
		}
	}, [isOpen, currentDependencies]);

	const isLoading =
		search !== debouncedSearch || getEngines.status !== "SUCCESS";

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(open) => !open && handleClose(false)}
		>
			<DialogContent className="sm:max-w-2xl">
				<DialogHeader>
					<div className="flex items-center justify-between">
						<DialogTitle>Add and Edit Dependencies</DialogTitle>
					</div>
				</DialogHeader>

				<div className="flex max-h-[80vh] flex-col gap-4 overflow-y-auto p-2">
					<div>
						<Muted className="mb-2 font-medium">
							Add Dependencies
						</Muted>

						<Popover
							open={dropdownOpen}
							onOpenChange={setDropdownOpen}
						>
							<PopoverTrigger asChild>
								<Button
									variant="outline"
									role="combobox"
									aria-expanded={dropdownOpen}
									className="w-full justify-between"
								>
									Select dependencies...
									<ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-[600px]" align="start">
								<Command
									shouldFilter={false}
									className="w-full"
								>
									<div className="flex items-center border-b px-3">
										<CommandInput
											placeholder="Search..."
											value={search}
											onValueChange={setSearch}
											className="flex-1"
										/>
										{isLoading && (
											<Loader2 className="mr-2 h-4 w-4 animate-spin text-muted-foreground" />
										)}
									</div>
									<CommandList className="max-h-[300px]">
										<CommandEmpty>
											No results found
										</CommandEmpty>
										<CommandGroup className="p-0">
											{allDeps.map((dep) => {
												const isSelected =
													selectedDeps.some(
														(d) => d.id === dep.id,
													);
												return (
													<CommandItem
														key={dep.id}
														onSelect={() =>
															handleToggleDependency(
																dep,
															)
														}
														className="flex items-center gap-2"
													>
														<div className="flex flex-1 items-center gap-2">
															<Badge
																variant="secondary"
																className="text-xs"
															>
																{capitalizeType(
																	dep.type,
																)}
															</Badge>
															<P className="text-sm">
																{dep.name}
															</P>
														</div>
														{isSelected && (
															<div className="h-2 w-2 rounded-full bg-primary" />
														)}
													</CommandItem>
												);
											})}
										</CommandGroup>
									</CommandList>
								</Command>
							</PopoverContent>
						</Popover>
					</div>

					{selectedDeps.length > 0 && (
						<div>
							<Muted className="mb-2 font-medium">
								Selected Dependencies ({selectedDeps.length})
							</Muted>
							<div className="flex flex-col gap-2">
								{selectedDeps.map((dep, idx: number) => {
									return (
										<div
											key={`${dep.id}-${idx}`}
											className="grid grid-cols-[auto_1fr_auto] items-center gap-2 rounded-lg border px-2 py-1"
										>
											<img
												src={
													dep.type === "PROJECT"
														? `${Env.MODULE}/api/project-${dep.id}/projectImage/download`
														: `${Env.MODULE}/api/e-${dep.id}/image/download`
												}
												alt={dep.name}
												className="h-12 w-12 rounded-lg object-cover"
											/>
											<div className="flex flex-col">
												<P className="font-semibold text-base">
													{dep.name}
												</P>
												<div className="flex items-center gap-1">
													<Muted className="text-sm">
														{`${capitalizeType(dep.type)} | Engine ID: ${dep.id}`}
													</Muted>
												</div>
											</div>
											<Button
												variant="ghost"
												size="icon"
												onClick={() =>
													handleRemoveDependency(
														dep.id,
													)
												}
												className="h-8 w-8"
											>
												<X className="h-4 w-4" />
											</Button>
										</div>
									);
								})}
							</div>
						</div>
					)}
				</div>

				<DialogFooter>
					<Button
						onClick={() => handleClose(false)}
						variant="outline"
					>
						Cancel
					</Button>
					<Button onClick={handleUpdateDependencies}>Save</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
