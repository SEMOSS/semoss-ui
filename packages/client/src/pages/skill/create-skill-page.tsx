import { ChevronRight, UploadIcon, X } from "lucide-react";
import { useId, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import {
	Badge,
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
	Button,
	Field,
	FieldLabel,
	H2,
	H4,
	Input,
	Muted,
	P,
	Progress,
	Separator,
	Textarea,
	toast,
} from "@semoss/ui/next";
import { AddAppModal } from "@/components/app";
import { NavbarHeader, NavbarLeft } from "@/components/shared";
import { useRootStore } from "@/hooks";
import { useNavigate } from "@/hooks/useNavigate";

type CreateSkillForm = {
	name: string;
	description: string;
	tags: string[];
	agentDescription: string;
	skillContent: string;
};

export const CreateSkillPage = () => {
	const navigate = useNavigate();
	const { monolithStore } = useRootStore();
	const [isUploadOpen, setIsUploadOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [tagInput, setTagInput] = useState("");
	const nameId = useId();
	const descId = useId();
	const tagId = useId();
	const agentDescId = useId();
	const skillContentId = useId();

	const {
		control,
		handleSubmit,
		formState: { isValid },
	} = useForm<CreateSkillForm>({
		mode: "onChange",
		defaultValues: {
			name: "",
			description: "",
			tags: [],
			agentDescription: "",
			skillContent: "",
		},
	});

	const navigateSkill = (appId: string) => {
		if (!appId) return;
		navigate(`/skill/${appId}/edit`);
	};

	const onSubmit = async (data: CreateSkillForm) => {
		try {
			setIsLoading(true);

			const { errors, pixelReturn } = await monolithStore.runQuery<
				{
					project_id: string;
				}[]
			>(
				`CreateSkill(skillContent=[${JSON.stringify(data.skillContent)}], name=[${JSON.stringify(data.name)}], description=[${JSON.stringify(data.agentDescription)}]);`,
			);

			if (errors.length > 0) throw new Error(errors.join(","));

			const appId = pixelReturn[0].output.project_id;
			if (!appId) throw new Error("Error creating skill");

			const hasMeta = data.tags.length > 0 || !!data.description;
			if (hasMeta) {
				const { pixelReturn: metaReturn } =
					await monolithStore.runQuery(
						`SetProjectMetadata(project=["${appId}"], meta=[${JSON.stringify(
							{ tag: data.tags, description: data.description },
						)}])`,
					);

				const operationType = metaReturn[0].operationType[0];
				if (operationType.indexOf("ERROR") > -1) {
					toast.error(String(metaReturn[0].output));
					return;
				}
			}

			navigateSkill(appId);
		} catch (e) {
			console.error(e);
			toast.error((e as Error).message || "Error creating skill");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<>
			<NavbarLeft>
				<NavbarHeader />
			</NavbarLeft>
			<div className="flex w-full flex-col items-start gap-6">
				<Breadcrumb>
					<BreadcrumbList>
						<BreadcrumbItem>
							<BreadcrumbLink asChild>
								<Link to="../" className="text-inherit">
									Skills
								</Link>
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator>
							<ChevronRight />
						</BreadcrumbSeparator>
						<BreadcrumbItem>
							<BreadcrumbPage>New</BreadcrumbPage>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>

				<div className="flex w-full flex-row items-start justify-between gap-4">
					<div className="flex flex-col gap-1">
						<H2>Create Skill</H2>
						<P className="text-muted-foreground">
							Define a reusable skill that agents can call
						</P>
					</div>
					<Button
						variant="outline"
						onClick={() => setIsUploadOpen(true)}
					>
						<UploadIcon />
						Upload
					</Button>
				</div>

				{isUploadOpen && (
					<AddAppModal
						type="skill"
						open={isUploadOpen}
						handleClose={(appId) => {
							if (appId) navigateSkill(appId);
							setIsUploadOpen(false);
						}}
					/>
				)}

				<form
					className="w-full"
					onSubmit={handleSubmit(onSubmit)}
					autoComplete="off"
				>
					{/* Details */}
					<div className="mb-4 flex flex-col gap-4">
						<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
							<div className="flex flex-1 flex-col gap-1">
								<H4 className="font-semibold text-base tracking-tight">
									Details
								</H4>
								<Muted className="text-muted-foreground text-sm leading-6">
									How this skill appears in the catalog
								</Muted>
							</div>

							<div className="flex flex-2 flex-col gap-3">
								<Controller
									name="name"
									control={control}
									rules={{ required: true }}
									render={({ field }) => (
										<Field>
											<FieldLabel htmlFor={nameId}>
												Name{" "}
												<span className="text-destructive">
													*
												</span>
											</FieldLabel>
											<Input
												id={nameId}
												placeholder="My Skill"
												{...field}
											/>
										</Field>
									)}
								/>

								<Controller
									name="description"
									control={control}
									render={({ field }) => (
										<Field>
											<FieldLabel htmlFor={descId}>
												Description
											</FieldLabel>
											<Textarea
												id={descId}
												placeholder="A short description shown in the catalog..."
												rows={3}
												className="max-h-40"
												{...field}
											/>
										</Field>
									)}
								/>

								<Controller
									name="tags"
									control={control}
									render={({ field }) => (
										<Field>
											<FieldLabel htmlFor={tagId}>
												Tags
											</FieldLabel>
											<Input
												id={tagId}
												placeholder='Press "Enter" to add tag'
												value={tagInput}
												onChange={(e) =>
													setTagInput(e.target.value)
												}
												onKeyDown={(e) => {
													if (e.key === "Enter") {
														e.preventDefault();
														const trimmed =
															tagInput.trim();
														if (
															trimmed &&
															!field.value.includes(
																trimmed,
															)
														) {
															field.onChange([
																...field.value,
																trimmed,
															]);
														}
														setTagInput("");
													}
												}}
											/>
											{field.value.length > 0 && (
												<div className="flex flex-wrap gap-1">
													{field.value.map((tag) => (
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
																		field.value.filter(
																			(
																				t,
																			) =>
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
										</Field>
									)}
								/>
							</div>
						</div>
						<Separator />
					</div>

					{/* Skill Definition */}
					<div className="mb-4 flex flex-col gap-4">
						<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
							<div className="flex flex-1 flex-col gap-1">
								<H4 className="font-semibold text-base tracking-tight">
									Skill Definition
								</H4>
								<Muted className="text-muted-foreground text-sm leading-6">
									What agents see when deciding how to use
									this skill
								</Muted>
							</div>

							<div className="flex flex-2 flex-col gap-3">
								<Controller
									name="agentDescription"
									control={control}
									rules={{ required: true }}
									render={({ field }) => (
										<Field>
											<FieldLabel htmlFor={agentDescId}>
												Agent Description{" "}
												<span className="text-destructive">
													*
												</span>
											</FieldLabel>
											<Textarea
												id={agentDescId}
												placeholder="What does this skill do and when should an agent use it?"
												rows={3}
												className="max-h-40"
												{...field}
											/>
										</Field>
									)}
								/>

								<Controller
									name="skillContent"
									control={control}
									rules={{ required: true }}
									render={({ field }) => (
										<Field>
											<FieldLabel
												htmlFor={skillContentId}
											>
												Content{" "}
												<span className="text-destructive">
													*
												</span>
											</FieldLabel>
											<Textarea
												id={skillContentId}
												placeholder="Full skill definition in Markdown..."
												rows={8}
												className="max-h-96"
												{...field}
											/>
										</Field>
									)}
								/>
							</div>
						</div>
						<Separator />
					</div>

					<div className="flex justify-end">
						<Button
							type="submit"
							disabled={!isValid || isLoading}
							className="w-full sm:w-auto"
						>
							Create Skill
						</Button>
					</div>
					{isLoading && <Progress className="h-1" />}
				</form>
			</div>
		</>
	);
};
