import { X } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import type { SerializedState } from "@semoss/renderer";
import {
	Badge,
	Button,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
	Label,
	Progress,
	Textarea,
	toast,
} from "@semoss/ui/next";
import { uploadImage } from "@/api";
import { useRootStore } from "@/hooks";
import type { AppMetadata } from "./app.types";

type NewAppForm = {
	APP_NAME: string;
	APP_DESCRIPTION: string;
	APP_TAGS: string[];
	APP_IMG: File | null;
};

interface NewAppModalProps {
	open: boolean;
	options:
		| { type: "automation" }
		| { type: "blocks"; state: SerializedState }
		| { type: "code" };
	onClose: (appId?: string) => void;
}

export const NewAppModal = (props: NewAppModalProps) => {
	const { open, options, onClose = () => null } = props;
	const { monolithStore, configStore } = useRootStore();
	const [isLoading, setIsLoading] = useState(false);
	const [tagInput, setTagInput] = useState("");
	const nameId = useId();
	const descId = useId();
	const tagsId = useId();
	const imgId = useId();

	const { getValues, handleSubmit, control, watch } = useForm<NewAppForm>({
		defaultValues: {
			APP_NAME: "",
			APP_DESCRIPTION: "",
			APP_TAGS: [],
			APP_IMG: null,
		},
	});

	const watchAll = watch();
	// biome-ignore lint/correctness/useExhaustiveDependencies: watchAll triggers re-evaluation on any field change
	const isFormValid = useMemo(() => !!getValues("APP_NAME"), [watchAll]);

	const onSubmit = handleSubmit(async (data: NewAppForm) => {
		let appId = "";

		const saveMetadata = async (
			resolvedAppId: string,
		): Promise<boolean> => {
			if (!data.APP_TAGS.length && !data.APP_DESCRIPTION) return true;
			const { pixelReturn } = await monolithStore.runQuery(
				`SetProjectMetadata(project=["${resolvedAppId}"], meta=[${JSON.stringify(
					{ tag: data.APP_TAGS, description: data.APP_DESCRIPTION },
				)}])`,
			);
			const operationType = pixelReturn[0].operationType[0];
			if (operationType.indexOf("ERROR") > -1) {
				toast.error(pixelReturn[0].output);
				return false;
			}
			return true;
		};

		try {
			setIsLoading(true);
			const { type } = options;

			if (type === "blocks") {
				const { state } = options;
				if (!state)
					throw new Error("State is missing from the blocks app");

				const { errors, pixelReturn } = await monolithStore.runQuery<
					[AppMetadata]
				>(
					`CreateAppFromBlocks ( project = [ "${
						data.APP_NAME
					}" ] , json =[${JSON.stringify(state)}]  ) ;`,
				);

				if (errors.length > 0) throw new Error(errors.join(","));

				appId = pixelReturn[0].output.project_id;

				if (data.APP_IMG && appId) {
					await uploadImage(
						data.APP_IMG,
						appId,
						configStore.store.insightID,
					);
				}

				if (!(await saveMetadata(appId))) return;
			} else if (type === "automation") {
				const pixel = `CreateProject(project=["${data.APP_NAME}"], portal=[true], projectType=["AUTOMATION"]);`;
				const { errors, pixelReturn } =
					await monolithStore.runQuery<[AppMetadata]>(pixel);

				if (errors.length > 0) throw new Error(errors.join(","));

				appId = pixelReturn[0].output.project_id;

				if (data.APP_IMG && appId) {
					await uploadImage(
						data.APP_IMG,
						appId,
						configStore.store.insightID,
					);
				}

				if (!(await saveMetadata(appId))) return;
			} else if (type === "code") {
				const pixel = `CreateProject(project=["${data.APP_NAME}"], portal=[true], projectType=["CODE"]);`;
				const { errors, pixelReturn } =
					await monolithStore.runQuery<[AppMetadata]>(pixel);

				if (errors.length > 0) throw new Error(errors.join(","));

				appId = pixelReturn[0].output.project_id;

				if (data.APP_IMG && appId) {
					await uploadImage(
						data.APP_IMG,
						appId,
						configStore.store.insightID,
					);
				}

				const newIndexFilePath = "version/assets/portals/index.html";
				const newIndexFileContent = `<html><style>html {font-family: sans-serif; padding: 30px;}</style><h1>${data.APP_NAME}</h1><p>This is placeholder text for your new Application.</p><p>You can add new files and edit this text using the Code Editor.</p></html>`;

				const saveIndexFilePixel = `
                    SaveAsset(fileName=["${newIndexFilePath}"], content=["<encode>${newIndexFileContent}</encode>"], space=["${appId}"]);
                    CommitAsset(filePath=["${newIndexFilePath}"], comment=["Hardcoded comment from the App Page editor"], space=["${appId}"])
                `;

				const response =
					await monolithStore.runQuery(saveIndexFilePixel);

				let output = response.pixelReturn[0].output;
				let operationType = response.pixelReturn[0].operationType[0];

				if (operationType.indexOf("ERROR") > -1) {
					toast.error(output);
					return;
				}

				output = response.pixelReturn[1].output;
				operationType = response.pixelReturn[1].operationType[0];

				if (operationType.indexOf("ERROR") > -1) {
					toast.error(output);
				}

				if (data.APP_TAGS.length || data.APP_DESCRIPTION) {
					const setProjectMetadataResponse =
						await monolithStore.runQuery(
							`SetProjectMetadata(project=["${appId}"], meta=[${JSON.stringify(
								{
									tag: data.APP_TAGS,
									description: data.APP_DESCRIPTION,
								},
							)}])`,
						);

					output = setProjectMetadataResponse.pixelReturn[0].output;
					operationType =
						setProjectMetadataResponse.pixelReturn[0]
							.operationType[0];

					if (operationType.indexOf("ERROR") > -1) {
						toast.error(output);
					}
				}
			} else {
				return;
			}

			if (!appId) throw new Error("Error creating app");
			onClose(appId);
		} catch (e) {
			console.error(e);
			toast.error(e.message);
		} finally {
			setIsLoading(false);
		}
	});

	return (
		<Dialog open={open} onOpenChange={() => !isLoading && onClose()}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>New App</DialogTitle>
				</DialogHeader>
				<form onSubmit={onSubmit}>
					<div className="flex flex-col gap-3 py-2">
						<Controller
							name="APP_NAME"
							control={control}
							rules={{ required: true }}
							render={({ field }) => (
								<div className="flex flex-col gap-1.5">
									<Label htmlFor={nameId}>Name</Label>
									<Input
										id={nameId}
										value={field.value ?? ""}
										disabled={isLoading}
										onChange={(e) =>
											field.onChange(e.target.value)
										}
										data-testid="newAppModal-textField-name"
									/>
								</div>
							)}
						/>
						<Controller
							name="APP_DESCRIPTION"
							control={control}
							render={({ field }) => (
								<div className="flex flex-col gap-1.5">
									<Label htmlFor={descId}>Description</Label>
									<Textarea
										id={descId}
										value={field.value ?? ""}
										onChange={(e) =>
											field.onChange(e.target.value)
										}
										rows={3}
										data-testid="newAppModal-description-txt"
									/>
								</div>
							)}
						/>
						<Controller
							name="APP_TAGS"
							control={control}
							render={({ field }) => {
								const tags: string[] = field.value || [];
								const addTag = () => {
									const trimmed = tagInput.trim();
									if (trimmed && !tags.includes(trimmed)) {
										field.onChange([...tags, trimmed]);
									}
									setTagInput("");
								};
								return (
									<div className="flex flex-col gap-1.5">
										<Label htmlFor={tagsId}>Tags</Label>
										<Input
											id={tagsId}
											value={tagInput}
											placeholder='Press "Enter" to add tag'
											onChange={(e) =>
												setTagInput(e.target.value)
											}
											onKeyDown={(e) => {
												if (e.key === "Enter") {
													e.preventDefault();
													addTag();
												}
											}}
											data-testid="newAppModal-tag-txt"
										/>
										{tags.length > 0 && (
											<div className="flex flex-wrap gap-1">
												{tags.map((tag) => (
													<Badge
														key={tag}
														variant="secondary"
														className="gap-1"
													>
														{tag}
														<button
															type="button"
															onClick={() =>
																field.onChange(
																	tags.filter(
																		(t) =>
																			t !==
																			tag,
																	),
																)
															}
															className="hover:text-destructive"
														>
															<X className="size-3" />
														</button>
													</Badge>
												))}
											</div>
										)}
									</div>
								);
							}}
						/>
						<Controller
							name="APP_IMG"
							control={control}
							render={({ field }) => (
								<div className="flex flex-col gap-1.5">
									<Label htmlFor={imgId}>Image</Label>
									<Input
										id={imgId}
										type="file"
										accept="image/*"
										disabled={isLoading}
										onChange={(e) => {
											const value = (
												e.target as HTMLInputElement
											).files;
											if (value && value.length > 0) {
												field.onChange(value[0]);
											}
										}}
										data-testid="newAppModal-file-txt"
									/>
								</div>
							)}
						/>
					</div>
					<DialogFooter className="pt-2">
						<Button
							type="button"
							variant="ghost"
							disabled={isLoading}
							onClick={() => onClose()}
							data-testid="newAppModal-cancel-btn"
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={isLoading || !isFormValid}
							data-testid="newAppModal-create-btn"
						>
							Create
						</Button>
					</DialogFooter>
				</form>
				{isLoading && <Progress className="h-1" />}
			</DialogContent>
		</Dialog>
	);
};
