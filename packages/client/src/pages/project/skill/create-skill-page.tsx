import { ChevronRight, UploadIcon, X } from "lucide-react";
import { useId, useState } from "react";
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
	H4,
	Input,
	Muted,
	P,
	Progress,
	Separator,
	Textarea,
	toast,
} from "@semoss/ui/next";
import { MarkdownEditor } from "@/components/common/MarkdownEditor";
import { UploadProjectDialog } from "@/components/project";
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
	const [form, setForm] = useState<CreateSkillForm>({
		name: "",
		description: "",
		tags: [],
		agentDescription: "",
		skillContent: "",
	});

	const nameId = useId();
	const descId = useId();
	const tagId = useId();
	const agentDescId = useId();
	const skillContentId = useId();

	const isValid =
		form.name.trim().length > 0 &&
		form.agentDescription.trim().length > 0 &&
		form.skillContent.trim().length > 0;

	const navigateSkill = (appId: string) => {
		if (!appId) return;
		navigate(`/skill/${appId}/edit`);
	};

	const onSubmit = async () => {
		try {
			setIsLoading(true);

			const { errors, pixelReturn } = await monolithStore.runQuery<
				{
					project_id: string;
				}[]
			>(
				`CreateSkill(skillContent=[${JSON.stringify(form.skillContent)}], name=[${JSON.stringify(form.name)}], description=[${JSON.stringify(form.agentDescription)}]);`,
			);

			if (errors.length > 0) throw new Error(errors.join(","));

			const appId = pixelReturn[0].output.project_id;
			if (!appId) throw new Error("Error creating skill");

			const hasMeta = form.tags.length > 0 || !!form.description;
			if (hasMeta) {
				const { pixelReturn: metaReturn } =
					await monolithStore.runQuery(
						`SetProjectMetadata(project=["${appId}"], meta=[${JSON.stringify(
							{ tag: form.tags, description: form.description },
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
				<NavbarHeader logo={null} />
				<Breadcrumb>
					<BreadcrumbList>
						<BreadcrumbItem>
							<BreadcrumbLink asChild>
								<Link to="../">Skill Catalog</Link>
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
			</NavbarLeft>
			<div className="flex flex-col gap-1">
				<div className="flex flex-row items-center justify-between gap-2">
					<H4>New Skill</H4>
					<Button
						variant="outline"
						onClick={() => setIsUploadOpen(true)}
					>
						<UploadIcon />
						Upload
					</Button>
				</div>
				<P className="mb-3 text-muted-foreground">
					In a platform where intelligent automation drives results,
					skills are the building blocks that power your agents.
					Whether you&apos;re a developer, data engineer, or product
					owner, this page helps you define, organize, and publish
					reusable capabilities - giving agents the precise
					instructions they need to take action reliably and
					consistently across your workflows.
				</P>
				<form
					className="my-4 w-full"
					onSubmit={(e) => {
						e.preventDefault();
						if (!isValid || isLoading) return;
						onSubmit();
					}}
					autoComplete="off"
				>
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
										value={form.name}
										onChange={(e) =>
											setForm((prev) => ({
												...prev,
												name: e.target.value,
											}))
										}
									/>
								</Field>
								<Field>
									<FieldLabel htmlFor={descId}>
										Description
									</FieldLabel>
									<Textarea
										id={descId}
										placeholder="A short description shown in the catalog..."
										rows={3}
										className="max-h-40"
										value={form.description}
										onChange={(e) =>
											setForm((prev) => ({
												...prev,
												description: e.target.value,
											}))
										}
									/>
								</Field>
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
												const trimmed = tagInput.trim();
												if (
													trimmed &&
													!form.tags.includes(trimmed)
												) {
													setForm((prev) => ({
														...prev,
														tags: [
															...prev.tags,
															trimmed,
														],
													}));
												}
												setTagInput("");
											}
										}}
									/>
									{form.tags.length > 0 && (
										<div className="flex flex-wrap gap-1">
											{form.tags.map((tag) => (
												<Badge
													key={tag}
													variant="secondary"
													className="gap-1"
												>
													{tag}
													<button
														type="button"
														onClick={() =>
															setForm((prev) => ({
																...prev,
																tags: prev.tags.filter(
																	(t) =>
																		t !==
																		tag,
																),
															}))
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
							</div>
						</div>
						<Separator />
					</div>
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
								<Field>
									<FieldLabel htmlFor={agentDescId}>
										Use{" "}
										<span className="text-destructive">
											*
										</span>
									</FieldLabel>
									<Textarea
										id={agentDescId}
										placeholder="What does this skill do and when should an agent use it?"
										rows={2}
										className="max-h-40"
										value={form.agentDescription}
										onChange={(e) =>
											setForm((prev) => ({
												...prev,
												agentDescription:
													e.target.value,
											}))
										}
									/>
								</Field>
								<Field>
									<FieldLabel htmlFor={skillContentId}>
										Definition{" "}
										<span className="text-destructive">
											*
										</span>
									</FieldLabel>
									<MarkdownEditor
										id={skillContentId}
										value={form.skillContent}
										className="h-[80vh]"
										onChange={(value) =>
											setForm((prev) => ({
												...prev,
												skillContent: value,
											}))
										}
									/>
								</Field>
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
							Create
						</Button>
					</div>
					{isLoading && <Progress className="h-1" />}
				</form>
			</div>
			{isUploadOpen && (
				<UploadProjectDialog
					type="SKILL"
					open={isUploadOpen}
					handleClose={(appId) => {
						if (appId) navigateSkill(appId);
						setIsUploadOpen(false);
					}}
				/>
			)}
		</>
	);
};
