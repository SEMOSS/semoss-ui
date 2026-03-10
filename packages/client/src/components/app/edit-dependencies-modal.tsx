import { Check, X } from "lucide-react";
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
	Popover,
	PopoverContent,
	PopoverTrigger,
	Spinner,
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
	const [open, setOpen] = useState(false);

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
			onClose(true);
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

	const toggleDependency = (dep: Dependency) => {
		const isSelected = selectedDeps.some(
			(selected) => selected.id === dep.id,
		);
		if (isSelected) {
			setSelectedDeps((prev) =>
				prev.filter((selected) => selected.id !== dep.id),
			);
			return;
		}
		setSelectedDeps((prev) => [...prev, dep]);
	};

	/**
	 * Effects
	 */
	useEffect(() => {
		if (getEngines.status !== "SUCCESS") {
			return;
		}

		setAllDeps(
			getEngines.data
				.map((engineProject) => {
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
				})
				.filter(Boolean) as Dependency[],
		);
	}, [getEngines.status, getEngines.data]);

	useEffect(() => {
		// Reset state when modal opens
		if (isOpen) {
			setSelectedDeps(currentDependencies);
			setSearch("");
			setOpen(false);
		}
	}, [isOpen, currentDependencies]);

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(nextOpen) => {
				if (!nextOpen) {
					onClose(false);
				}
			}}
		>
			<DialogContent className="max-h-[90vh] overflow-auto sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle>Add and Edit Dependencies</DialogTitle>
				</DialogHeader>

				<div className="space-y-4">
					<p className="font-medium text-sm">Linked Dependencies</p>

					<Popover open={open} onOpenChange={setOpen}>
						<PopoverTrigger asChild>
							<Button
								variant="outline"
								role="combobox"
								className="w-full justify-between"
							>
								{selectedDeps.length === 0
									? "Search dependencies"
									: selectedDeps.length === 1
										? selectedDeps[0].name
										: `${selectedDeps.length} dependencies selected`}
							</Button>
						</PopoverTrigger>
						<PopoverContent className="w-[600px] p-0">
							<Command shouldFilter={false}>
								<CommandInput
									placeholder="Search dependencies..."
									value={search}
									onValueChange={(value) => {
										setSearch(value);
									}}
								/>
								<CommandList>
									{getEngines.status !== "SUCCESS" ? (
										<div className="flex items-center justify-center p-4">
											<Spinner />
										</div>
									) : (
										<>
											<CommandEmpty>
												No dependencies found.
											</CommandEmpty>
											<CommandGroup>
												{allDeps.map((option) => {
													const isSelected =
														selectedDeps.some(
															(selected) =>
																selected.id ===
																option.id,
														);
													return (
														<CommandItem
															key={option.id}
															onSelect={() => {
																toggleDependency(
																	option,
																);
															}}
															className="justify-between"
														>
															<div className="flex items-center gap-2">
																<Badge variant="outline">
																	{capitalizeType(
																		option.type,
																	)}
																</Badge>
																<span className="text-sm">
																	{
																		option.name
																	}
																</span>
															</div>
															{isSelected && (
																<Check className="size-4 text-primary" />
															)}
														</CommandItem>
													);
												})}
											</CommandGroup>
										</>
									)}
								</CommandList>
							</Command>
						</PopoverContent>
					</Popover>

					<div className="space-y-3">
						{selectedDeps.map((dep, idx: number) => {
							return (
								<div
									key={`${dep.id}-${idx}`}
									className="grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-lg border p-3"
								>
									<img
										className="h-12 w-12 rounded-lg object-cover"
										src={
											dep.type === "PROJECT"
												? `${Env.MODULE}/api/project-${dep.id}/projectImage/download`
												: `${Env.MODULE}/api/e-${dep.id}/image/download`
										}
										alt={dep.name}
									/>
									<div>
										<p className="font-medium text-sm">
											{dep.name}
										</p>
										<p className="text-muted-foreground text-xs">
											{`${capitalizeType(dep.type)} | Engine ID: ${dep.id}`}
										</p>
									</div>
									<Button
										variant="ghost"
										size="icon-sm"
										onClick={() =>
											handleRemoveDependency(dep.id)
										}
									>
										<X className="size-4" />
									</Button>
								</div>
							);
						})}
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={() => onClose(false)}>
						Cancel
					</Button>
					<Button onClick={handleUpdateDependencies}>Save</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
