import { X } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
import { usePixel } from "@semoss/sdk/react";
import type { Project } from "@semoss/shared";
import {
	Button,
	Checkbox,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Field,
	FieldLabel,
	Input,
	Spinner,
	Textarea,
	toast,
} from "@semoss/ui/next";
import { MarkdownEditor } from "@/components/common";
import { useRootStore } from "@/hooks";

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
		<Field>
			<FieldLabel>{label}</FieldLabel>
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
		</Field>
	);
};

interface EditProjectDetailModalProps {
	open: boolean;
	project: Project;
	onClose: (success: boolean) => void;
}

export const EditProjectDetailDialog = ({
	open,
	project,
	onClose,
}: EditProjectDetailModalProps) => {
	const { configStore } = useRootStore();
	const descriptionId = useId();

	const [isLoading, setIsLoading] = useState(false);
	const [form, setForm] = useState<
		{
			description: string;
			markdown: string;
			tag: string | string[];
		} & Record<string, unknown>
	>({
		description: "",
		markdown: "",
		tag: [],
	});

	useEffect(() => {
		setForm({
			description: project.description || "",
			markdown: project.markdown || "",
			tag: [],
			...project,
		});
	}, [project]);

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

	const getProjectMetaValues = usePixel<
		{
			METAKEY: string;
			METAVALUE: string;
			count: number;
		}[]
	>(`META | GetProjectMetaValues ( metaKeys = ['tag'] ) ;`);

	useEffect(() => {
		if (
			getProjectMetaValues.status !== "SUCCESS" ||
			!getProjectMetaValues.data
		) {
			return;
		}

		const updated = getProjectMetaValues.data.reduce<
			Record<string, string[]>
		>((prev, current) => {
			if (!prev[current.METAKEY]) {
				prev[current.METAKEY] = [];
			}
			prev[current.METAKEY].push(current.METAVALUE);
			return prev;
		}, {});

		const metaKeysWithOpts = projectMetaKeys.filter((k) => {
			return k.display_options === "select-box";
		});

		metaKeysWithOpts.forEach((filter) => {
			if (filter.display_values) {
				updated[filter.metakey] = filter.display_values.split(",");
			}
		});

		setFilterOptions(updated);
	}, [
		projectMetaKeys,
		getProjectMetaValues.status,
		getProjectMetaValues.data,
	]);

	/**
	 *
	 */
	const handleSubmit = async () => {
		try {
			setIsLoading(true);

			// update the metadata for the project
			await configStore.runPixel(
				`SetProjectMetadata(project=["${project.project_id}"], meta=[${JSON.stringify(
					form,
				)}])`,
			);

			// mark as successful and close
			onClose(true);
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Error updating details",
			);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(open) => {
				if (!open) {
					onClose(false);
				}
			}}
		>
			<DialogContent
				className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-2xl"
				data-testid="edit-app-details-modal"
			>
				<DialogHeader>
					<DialogTitle>Edit Details</DialogTitle>
				</DialogHeader>

				<div className="flex-1 space-y-6 overflow-y-auto">
					<Field>
						<FieldLabel htmlFor={descriptionId}>
							Description
						</FieldLabel>
						<Textarea
							id={descriptionId}
							value={form.description}
							onChange={(event) =>
								setForm((prev) => ({
									...prev,
									description: event.target.value,
								}))
							}
							placeholder="Please provide a description for this app to help others find it and understand how to use it."
							data-testid="description"
						/>
					</Field>

					<Field>
						<FieldLabel>Main Uses</FieldLabel>
						<MarkdownEditor
							className="h-[200px]"
							value={form.markdown}
							onChange={(value) =>
								setForm((prev) => ({
									...prev,
									markdown: value,
								}))
							}
							data-testid="markdown"
						/>
					</Field>

					<TagInput
						value={form.tag || []}
						onChange={(value) =>
							setForm((prev) => ({ ...prev, tag: value }))
						}
						label="Tags"
						placeholder="Press enter to add tags"
						testId="tags"
					/>

					{projectMetaKeys.map((key) => {
						const { metakey, display_options } = key;
						const label =
							metakey.slice(0, 1).toUpperCase() +
							metakey.slice(1);

						if (display_options === "markdown") {
							return (
								<Field key={metakey} className="mb-1">
									<FieldLabel>{label}</FieldLabel>
									<MarkdownEditor
										value={(form[metakey] as string) || ""}
										onChange={(value) =>
											setForm((prev) => ({
												...prev,
												[metakey]: value,
											}))
										}
										data-testid="markdown-editor"
									/>
								</Field>
							);
						}

						if (display_options === "textarea") {
							return (
								<Field key={metakey}>
									<FieldLabel htmlFor={metakey}>
										{label}
									</FieldLabel>
									<Textarea
										id={metakey}
										value={(form[metakey] as string) || ""}
										onChange={(event) =>
											setForm((prev) => ({
												...prev,
												[metakey]: event.target.value,
											}))
										}
									/>
								</Field>
							);
						}

						if (display_options === "single-typeahead") {
							return (
								<Field key={metakey}>
									<FieldLabel htmlFor={metakey}>
										{label}
									</FieldLabel>
									<div className="relative">
										<Input
											id={metakey}
											type="text"
											placeholder={`Select ${label.toLowerCase()}...`}
											value={
												(form[metakey] as string) || ""
											}
											onChange={(event) =>
												setForm((prev) => ({
													...prev,
													[metakey]:
														event.target.value,
												}))
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
								</Field>
							);
						}

						if (display_options === "multi-typeahead") {
							return (
								<TagInput
									key={metakey}
									value={(form[metakey] as string[]) || []}
									onChange={(value) =>
										setForm((prev) => ({
											...prev,
											[metakey]: value,
										}))
									}
									label={label}
									placeholder={`Press enter to add ${metakey}`}
								/>
							);
						}

						if (display_options === "select-box") {
							return (
								<Field key={metakey}>
									<FieldLabel htmlFor={metakey}>
										{label}
									</FieldLabel>
									<div className="flex flex-wrap gap-2 rounded-md border border-input bg-transparent p-2">
										{(filterOptions[metakey] || []).map(
											(option) => {
												const rawValue = form[metakey];
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
													<div
														key={option}
														className="flex cursor-pointer items-center gap-2"
													>
														<Checkbox
															checked={checked}
															onCheckedChange={(
																isChecked,
															) => {
																if (
																	isChecked !==
																	true
																) {
																	setForm(
																		(
																			prev,
																		) => ({
																			...prev,
																			[metakey]:
																				selectedValues.filter(
																					(
																						v,
																					) =>
																						v !==
																						option,
																				),
																		}),
																	);
																	return;
																}

																if (checked) {
																	setForm(
																		(
																			prev,
																		) => ({
																			...prev,
																			[metakey]:
																				selectedValues.filter(
																					(
																						v,
																					) =>
																						v !==
																						option,
																				),
																		}),
																	);
																} else {
																	setForm(
																		(
																			prev,
																		) => ({
																			...prev,
																			[metakey]:
																				[
																					...selectedValues,
																					option,
																				],
																		}),
																	);
																}
															}}
														/>
														<span className="text-sm">
															{option}
														</span>
													</div>
												);
											},
										)}
									</div>
								</Field>
							);
						}

						return null;
					})}
				</div>

				<DialogFooter data-testid="edit-app-details-modal-actions">
					<Button
						variant="outline"
						onClick={() => onClose(false)}
						data-testid="cancel"
					>
						Close
					</Button>
					<Button
						disabled={
							isLoading ||
							getProjectMetaValues.status !== "SUCCESS"
						}
						onClick={() => handleSubmit()}
						data-testid="save"
					>
						{isLoading ? <Spinner className="size-4" /> : "Save"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
