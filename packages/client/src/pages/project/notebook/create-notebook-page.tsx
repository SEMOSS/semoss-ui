import { ChevronRight, UploadIcon, X } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { runPixel } from "@semoss/sdk/react";
import type { Project } from "@semoss/shared";
import {
	Badge,
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
	Button,
	Form,
	FormInput,
	FormTextarea,
	H4,
	Muted,
	P,
	Separator,
	toast,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";
import { UploadProjectDialog } from "@/components/project";
import { NavbarHeader, NavbarLeft } from "@/components/shared";
import { TemplateGrid } from "@/components/templates";

const schema = z.object({
	name: z.string().trim().min(1, "Name is required"),
	description: z.string(),
	tags: z.array(z.string()),
	tagInput: z.string(),
});

type FormValues = z.infer<typeof schema>;

export const CreateNotebookPage = () => {
	const navigate = useNavigate();
	const [isUploadOpen, setIsUploadOpen] = useState(false);
	// Nothing is selected by default, so a plain empty notebook is created.
	const [template, setTemplate] = useState<Project | null>(null);
	const form = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: {
			name: "",
			description: "",
			tags: [],
			tagInput: "",
		},
	});

	const navigateNotebook = (appId: string) => {
		if (!appId) {
			return;
		}

		navigate(`/notebook/${appId}/edit`);
	};

	const handleSubmit = async (values: FormValues) => {
		try {
			// Clone the chosen template, or create an empty notebook.
			const pixel = template
				? `CreateAppFromTemplate(project=[${JSON.stringify(
						values.name,
					)}], projectTemplate=[${JSON.stringify(
						template.project_id,
					)}], global=["false"]);`
				: `CreateNotebook(project=[${JSON.stringify(values.name)}]);`;

			const { errors, pixelReturn } =
				await runPixel<
					{
						project_id: string;
					}[]
				>(pixel);

			if (errors.length > 0) throw new Error(errors.join(","));

			const appId = pixelReturn[0]?.output?.project_id;
			if (!appId) throw new Error("Error creating notebook");

			const hasMeta = values.tags.length > 0 || !!values.description;
			if (hasMeta) {
				const { pixelReturn: metaReturn } = await runPixel(
					`SetProjectMetadata(project=["${appId}"], meta=[${JSON.stringify(
						{ tag: values.tags, description: values.description },
					)}])`,
				);

				const operationType = metaReturn[0].operationType[0];
				if (operationType.indexOf("ERROR") > -1) {
					toast.error(String(metaReturn[0].output));
					return;
				}
			}

			navigateNotebook(appId);
		} catch (e) {
			console.error(e);
			toast.error((e as Error).message || "Error creating notebook");
		}
	};

	const tags = form.watch("tags");

	return (
		<>
			<NavbarLeft>
				<NavbarHeader logo={null} />
				<Breadcrumb>
					<BreadcrumbList>
						<BreadcrumbItem>
							<BreadcrumbLink asChild>
								<Link to="../">Notebook Catalog</Link>
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
					<H4>New Notebook</H4>
					<Button
						variant="outline"
						onClick={() => setIsUploadOpen(true)}
					>
						<UploadIcon />
						Upload
					</Button>
				</div>
				<P className="mb-3 text-muted-foreground">
					Create and manage notebooks to build reusable data
					processing and analysis workflows. This page helps you
					define, organize, and publish notebooks that agents can
					leverage to perform complex computations and data tasks.
				</P>
				<Form
					form={form}
					onSubmit={handleSubmit}
					className="my-4 w-full"
					autoComplete="off"
				>
					<div className="mb-4 flex flex-col gap-4">
						<div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
							<div className="flex flex-1 flex-col gap-1">
								<H4 className="font-semibold text-base tracking-tight">
									Details
								</H4>
								<Muted className="text-muted-foreground text-sm leading-6">
									How this notebook appears in the catalog
								</Muted>
							</div>
							<div className="flex flex-2 flex-col gap-3">
								<FormInput
									name="name"
									label={
										<>
											Name{" "}
											<span className="text-destructive">
												*
											</span>
										</>
									}
									placeholder="My Notebook"
									disabled={form.formState.isSubmitting}
								/>
								<FormTextarea
									name="description"
									label="Description"
									placeholder="Describe what this notebook does..."
									rows={3}
									className="max-h-40"
									disabled={form.formState.isSubmitting}
								/>
								<FormInput
									name="tagInput"
									label="Tags"
									placeholder="e.g., data-processing, ml (press Enter)"
									onKeyDown={(e) => {
										if (e.key === "Enter") {
											e.preventDefault();
											const trimmed = form
												.getValues("tagInput")
												.trim();
											if (
												trimmed &&
												!form
													.getValues("tags")
													.includes(trimmed)
											) {
												form.setValue("tags", [
													...form.getValues("tags"),
													trimmed,
												]);
											}
											form.setValue("tagInput", "");
										}
									}}
									disabled={form.formState.isSubmitting}
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
														form.setValue(
															"tags",
															form
																.getValues(
																	"tags",
																)
																.filter(
																	(value) =>
																		value !==
																		tag,
																),
														)
													}
													disabled={
														form.formState
															.isSubmitting
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
						</div>
						<Separator />
					</div>
					<div className="mb-4 flex flex-col gap-4">
						<div className="flex flex-col gap-1">
							<H4 className="font-semibold text-base tracking-tight">
								Template
							</H4>
							<Muted className="text-muted-foreground text-sm leading-6">
								Optionally start from an existing notebook
								template
							</Muted>
						</div>
						<TemplateGrid
							type="NOTEBOOK"
							selected={template}
							onSelect={setTemplate}
							showScratchOption
							disabled={form.formState.isSubmitting}
						/>
						<Separator />
					</div>
					<div className="flex justify-end">
						<Button
							type="submit"
							disabled={form.formState.isSubmitting}
							className="w-full sm:w-auto"
						>
							{form.formState.isSubmitting
								? "Creating..."
								: "Create"}
						</Button>
					</div>
				</Form>
			</div>
			{isUploadOpen && (
				<UploadProjectDialog
					type="NOTEBOOK"
					open={isUploadOpen}
					handleClose={(appId) => {
						if (appId) {
							navigateNotebook(appId);
						}
						setIsUploadOpen(false);
					}}
				/>
			)}
		</>
	);
};
