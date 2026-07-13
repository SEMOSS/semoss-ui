import { X } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
import {
	Button,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
	Label,
} from "@semoss/ui/next";
import { usePixel, useRootStore } from "@/hooks";
import { MarkdownEditor } from "../common";
import type { DetailsForm } from "./app-details.utility";

interface TagInputProps {
	value: string[] | string | undefined;
	onChange: (value: string[]) => void;
	label: string;
	placeholder: string;
	testId?: string;
}

const TagInput = ({
	value,
	onChange,
	label,
	placeholder,
	testId,
}: TagInputProps) => {
	const [inputValue, setInputValue] = useState("");
	const selectedTags = (
		Array.isArray(value) ? value : value ? [value] : []
	).filter((tag) => typeof tag === "string" && tag.trim() !== "");

	const addTag = (tag: string) => {
		const trimmed = tag.trim();
		if (trimmed && !selectedTags.includes(trimmed)) {
			onChange([...selectedTags, trimmed]);
			setInputValue("");
		}
	};

	const removeTag = (tag: string) => {
		onChange(selectedTags.filter((t) => t !== tag));
	};

	return (
		<div className="space-y-2">
			<Label>{label}</Label>
			<div className="flex flex-wrap gap-2 rounded-md border border-input bg-transparent p-2">
				{selectedTags.map((tag) => (
					<span
						key={tag}
						className="inline-flex items-center gap-1 rounded bg-muted px-2 py-1 text-foreground text-sm"
					>
						{tag}
						<button
							type="button"
							onClick={(event) => {
								event.preventDefault();
								removeTag(tag);
							}}
							className="hover:opacity-70"
						>
							<X className="size-3" />
						</button>
					</span>
				))}
				<input
					type="text"
					value={inputValue}
					onChange={(event) => setInputValue(event.target.value)}
					onKeyDown={(event) => {
						if (event.key === "Enter") {
							event.preventDefault();
							addTag(inputValue);
						}
					}}
					placeholder={placeholder}
					className="min-w-[100px] flex-1 bg-transparent text-sm outline-none"
					data-testid={testId}
				/>
			</div>
		</div>
	);
};

interface EditDetailsModalProps {
	isOpen: boolean;
	onClose: (reset?: boolean) => void;
	detailsForm: DetailsForm;
	onDetailsFormChange: (updater: (prev: DetailsForm) => DetailsForm) => void;
	onSubmit: () => void;
}

export const EditDetailsModal = (props: EditDetailsModalProps) => {
	const { isOpen, onClose, detailsForm, onDetailsFormChange, onSubmit } =
		props;
	const { configStore } = useRootStore();
	const descriptionId = useId();

	const handleEditAppDetails = () => {
		onSubmit();
	};

	const projectMetaKeys = useMemo(() => {
		return configStore.store.config.projectMetaKeys.filter((k) => {
			return (
				k.metakey !== "description" &&
				k.metakey !== "markdown" &&
				k.metakey !== "tag" &&
				k.metakey !== "tags"
			);
		});
	}, [configStore.store.config.projectMetaKeys]);

	const [filterOptions, setFilterOptions] = useState<
		Record<string, string[]>
	>(() => {
		return projectMetaKeys.reduce<Record<string, string[]>>(
			(prev, current) => {
				prev[current.metakey] = [];
				return prev;
			},
			{},
		);
	});

	const projectMetaValues = usePixel<
		{
			METAKEY: string;
			METAVALUE: string;
			count: number;
		}[]
	>(`META | GetProjectMetaValues ( metaKeys = ['tag'] ) ;`);

	useEffect(() => {
		if (projectMetaValues.status !== "SUCCESS" || !projectMetaValues.data) {
			return;
		}

		const updated = projectMetaValues.data.reduce<Record<string, string[]>>(
			(prev, current) => {
				if (!prev[current.METAKEY]) {
					prev[current.METAKEY] = [];
				}
				prev[current.METAKEY].push(current.METAVALUE);
				return prev;
			},
			{},
		);

		const metaKeysWithOpts = projectMetaKeys.filter((k) => {
			return k.display_options === "select-box";
		});

		metaKeysWithOpts.forEach((filter) => {
			if (filter.display_values) {
				updated[filter.metakey] = filter.display_values.split(",");
			}
		});

		setFilterOptions(updated);
	}, [projectMetaKeys, projectMetaValues.status, projectMetaValues.data]);

	const getDetailValue = (key: string): unknown => detailsForm[key];

	const setDetailValue = (key: string, value: unknown) => {
		onDetailsFormChange((prev) => ({
			...prev,
			[key]: value,
		}));
	};

	return (
		<Dialog
			open={isOpen}
			onOpenChange={(nextOpen) => {
				if (!nextOpen) {
					onClose(false);
				}
			}}
		>
			<DialogContent
				className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-2xl"
				data-testid="edit-app-details-modal"
			>
				<DialogHeader>
					<DialogTitle>Edit App Details</DialogTitle>
				</DialogHeader>

				<div className="flex-1 space-y-6 overflow-y-auto">
					<div className="space-y-2">
						<Label htmlFor={descriptionId}>Description</Label>
						<textarea
							id={descriptionId}
							className="flex max-h-[72px] min-h-[72px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
							value={
								(getDetailValue("description") as string) ?? ""
							}
							onChange={(event) =>
								setDetailValue(
									"description",
									event.target.value,
								)
							}
							placeholder="Please provide a description for this app to help others find it and understand how to use it."
							data-testid="description"
						/>
					</div>

					<div className="space-y-2">
						<Label>Main Uses</Label>
						<MarkdownEditor
							className="h-[200px]"
							value={(getDetailValue("markdown") as string) || ""}
							onChange={(value) =>
								setDetailValue("markdown", value)
							}
							data-testid="markdown"
						/>
					</div>

					<TagInput
						value={
							(getDetailValue("tag") as
								| string[]
								| string
								| undefined) || []
						}
						onChange={(value) => setDetailValue("tag", value)}
						label="Tags"
						placeholder="Press enter to add tags"
						testId="tags"
					/>

					<div className="space-y-2">
						<Label>Image</Label>
						<Input
							type="file"
							accept="image/*"
							onChange={(event) => {
								const value = (event.target as HTMLInputElement)
									.files;
								if (value && value.length > 0) {
									setDetailValue("appImage", value[0]);
								}
							}}
							data-testid="app-image"
						/>
					</div>

					{projectMetaKeys.map((key) => {
						const { metakey, display_options } = key;
						const label =
							metakey.slice(0, 1).toUpperCase() +
							metakey.slice(1);

						if (display_options === "markdown") {
							return (
								<div key={metakey} className="mb-1">
									<MarkdownEditor
										value={
											(getDetailValue(
												metakey,
											) as string) || ""
										}
										onChange={(value) =>
											setDetailValue(metakey, value)
										}
										data-testid="markdown-editor"
									/>
								</div>
							);
						}

						if (display_options === "textarea") {
							return (
								<div key={metakey} className="space-y-2">
									<Label htmlFor={metakey}>{label}</Label>
									<textarea
										id={metakey}
										className="flex max-h-[72px] min-h-[72px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
										value={
											(getDetailValue(
												metakey,
											) as string) || ""
										}
										onChange={(event) =>
											setDetailValue(
												metakey,
												event.target.value,
											)
										}
									/>
								</div>
							);
						}

						if (display_options === "single-typeahead") {
							return (
								<div key={metakey} className="space-y-2">
									<Label htmlFor={metakey}>{label}</Label>
									<div className="relative">
										<input
											id={metakey}
											type="text"
											className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-base placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
											placeholder={`Select ${label.toLowerCase()}...`}
											value={
												(getDetailValue(
													metakey,
												) as string) || ""
											}
											onChange={(event) =>
												setDetailValue(
													metakey,
													event.target.value,
												)
											}
											list={`${metakey}-list`}
										/>
										<datalist id={`${metakey}-list`}>
											{(filterOptions[metakey] || []).map(
												(option) => (
													<option
														key={option}
														value={option}
													/>
												),
											)}
										</datalist>
									</div>
								</div>
							);
						}

						if (display_options === "multi-typeahead") {
							return (
								<TagInput
									key={metakey}
									value={
										(getDetailValue(metakey) as string[]) ||
										[]
									}
									onChange={(value) =>
										setDetailValue(metakey, value)
									}
									label={label}
									placeholder={`Press enter to add ${metakey}`}
								/>
							);
						}

						if (display_options === "select-box") {
							return (
								<div key={metakey} className="space-y-2">
									<Label htmlFor={metakey}>{label}</Label>
									<div className="flex flex-wrap gap-2 rounded-md border border-input bg-transparent p-2">
										{(filterOptions[metakey] || []).map(
											(option) => {
												const rawValue =
													getDetailValue(metakey);
												const formattedValue =
													typeof rawValue === "string"
														? [rawValue]
														: rawValue;
												const selectedValues = (
													Array.isArray(
														formattedValue,
													)
														? formattedValue
														: []
												) as string[];
												const checked =
													selectedValues.includes(
														option,
													);

												return (
													<label
														key={option}
														className="flex cursor-pointer items-center gap-2"
													>
														<input
															type="checkbox"
															checked={checked}
															onChange={() => {
																if (checked) {
																	setDetailValue(
																		metakey,
																		selectedValues.filter(
																			(
																				v,
																			) =>
																				v !==
																				option,
																		),
																	);
																} else {
																	setDetailValue(
																		metakey,
																		[
																			...selectedValues,
																			option,
																		],
																	);
																}
															}}
															className="rounded border-input"
														/>
														<span className="text-sm">
															{option}
														</span>
													</label>
												);
											},
										)}
									</div>
								</div>
							);
						}

						return null;
					})}
				</div>

				<DialogFooter data-testid="edit-app-details-modal-actions">
					<Button
						variant="outline"
						onClick={() => onClose(true)}
						data-testid="cancel"
					>
						Close
					</Button>
					<Button onClick={handleEditAppDetails} data-testid="save">
						Submit
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
