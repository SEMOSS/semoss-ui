import { ChevronRight, UploadIcon, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
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
	FormFileDropzone,
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
import { uploadImage } from "@/api";
import { UploadProjectDialog } from "@/components/project";
import { NavbarHeader, NavbarLeft } from "@/components/shared";
import { TemplateGrid } from "@/components/templates";
import { PROJECT_IMAGE_ACCEPT } from "@/constants";
import { useSession } from "@/hooks";
import { useNavigate } from "@/hooks/useNavigate";

const schema = z.object({
	name: z.string().trim().min(1, "Name is required"),
	description: z.string(),
	tags: z.array(z.string()),
	tagInput: z.string(),
	image: z.instanceof(File).nullable(),
});

type CreateAppForm = z.infer<typeof schema>;

/** Placeholder portal for a new code app. */
const buildIndexFile = (name: string) =>
	`<html><style>html {font-family: sans-serif; padding: 30px;}</style><h1>${name}</h1><p>This is placeholder text for your new Application.</p><p>You can add new files and edit this text using the Code Editor.</p></html>`;

export const CreateAppPage = () => {
	const navigate = useNavigate();
	const runPixel = useSession((state) => state.runPixel);
	const insightID = useSession((state) => state.insightID);

	const [isUploadOpen, setIsUploadOpen] = useState(false);
	// Nothing is selected by default, so a plain empty app is created.
	const [template, setTemplate] = useState<Project | null>(null);
	const form = useForm<CreateAppForm>({
		resolver: zodResolver(schema),
		defaultValues: {
			name: "",
			description: "",
			tags: [],
			tagInput: "",
			image: null,
		},
	});

	/**
	 * Navigate to the app and open it
	 *
	 * appId - appId of the app
	 */
	const navigateApp = (appId: string) => {
		if (!appId) {
			return;
		}

		navigate(`/app/${appId}/edit`);
	};

	/**
	 * Create the project and return its id.
	 */
	const createProject = async (values: CreateAppForm) => {
		const pixel = `CreateProject(project=[${JSON.stringify(
			values.name,
		)}], portal=[true], projectType=["CODE"]);`;

		const { errors, pixelReturn } = await runPixel<[Project]>(pixel);

		if (errors.length > 0) throw new Error(errors.join(","));

		return pixelReturn[0].output.project_id;
	};

	/**
	 * Clone the selected template into a new project and return its id.
	 */
	const createFromTemplate = async (
		values: CreateAppForm,
		selected: Project,
	) => {
		const { errors, pixelReturn } = await runPixel(
			`CreateAppFromTemplate(project=[${JSON.stringify(
				values.name,
			)}], projectTemplate=[${JSON.stringify(
				selected.project_id,
			)}], global=["false"]);`,
		);

		if (errors.length > 0) throw new Error(errors.join(","));

		return String(
			(pixelReturn[0]?.output as { project_id?: string })?.project_id ||
				"",
		);
	};

	/**
	 * Seed a code app with a placeholder portal so it renders on first open.
	 */
	const savePortal = async (appId: string, name: string) => {
		const filePath = "version/assets/portals/index.html";
		const { pixelReturn } = await runPixel(`
			SaveAsset(fileName=["${filePath}"], content=["<encode>${buildIndexFile(
				name,
			)}</encode>"], space=["${appId}"]);
			CommitAsset(filePath=["${filePath}"], comment=["Created from the New App page"], space=["${appId}"])
		`);

		for (const step of pixelReturn) {
			if (step.operationType.indexOf("ERROR") > -1) {
				toast.error(String(step.output));
				return;
			}
		}
	};

	const saveMetadata = async (
		appId: string,
		values: Pick<CreateAppForm, "tags" | "description">,
	) => {
		if (!values.tags.length && !values.description) {
			return;
		}

		const { pixelReturn } = await runPixel(
			`SetProjectMetadata(project=["${appId}"], meta=[${JSON.stringify({
				tag: values.tags,
				description: values.description,
			})}])`,
		);

		if (pixelReturn[0].operationType[0].indexOf("ERROR") > -1) {
			toast.error(String(pixelReturn[0].output));
		}
	};

	const handleSubmit = async (values: CreateAppForm) => {
		try {
			const appId = template
				? await createFromTemplate(values, template)
				: await createProject(values);
			if (!appId) throw new Error("Error creating app");

			if (values.image) {
				try {
					await uploadImage([values.image], appId, insightID);
				} catch (e) {
					console.error(e);
					// the app exists either way, so a failed image must not
					// abort the rest of the flow
					toast.warning(
						"App created, but the image failed to upload",
					);
				}
			}

			// A template already ships its own portal — only seed the
			// placeholder for an app created from scratch.
			if (!template) {
				await savePortal(appId, values.name);
			}
			await saveMetadata(appId, values);

			navigateApp(appId);
		} catch (e) {
			console.error(e);
			toast.error((e as Error).message || "Error creating app");
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
								<Link to="../">App Catalog</Link>
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
				<div className="flex flex-row flex-wrap items-center justify-between gap-2">
					<H4>New App</H4>
					<div className="flex flex-row items-center gap-2">
						<Button
							variant="outline"
							data-testid="createAppSection-upload-btn"
							onClick={() => setIsUploadOpen(true)}
						>
							<UploadIcon />
							Upload
						</Button>
					</div>
				</div>
				<P className="mb-3 text-muted-foreground">
					In a platform where data drives decisions, apps are how data
					come to life. Whether you're a developer, data engineer, or
					product owner, this page helps you build, organize, and
					share interactive experiences — from drag-and-drop layouts
					to custom code and agent-powered workflows — so your team
					can turn data into action.
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
									How this app appears in the catalog
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
									placeholder="My App"
									disabled={form.formState.isSubmitting}
									data-testid="createAppPage-name-txt"
								/>
								<FormTextarea
									name="description"
									label="Description"
									placeholder="Describe what this app does..."
									rows={3}
									className="max-h-40"
									disabled={form.formState.isSubmitting}
									data-testid="createAppPage-description-txt"
								/>
								<FormInput
									name="tagInput"
									label="Tags"
									placeholder='Press "Enter" to add tag'
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
									data-testid="createAppPage-tag-txt"
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
								<FormFileDropzone
									name="image"
									label="Image"
									extensions={PROJECT_IMAGE_ACCEPT}
									disabled={form.formState.isSubmitting}
									data-testid="createAppPage-image-txt"
								/>
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
								Optionally start from an existing app template
							</Muted>
						</div>
						<TemplateGrid
							type="CODE"
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
							data-testid="createAppPage-create-btn"
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
					type="APP"
					open={isUploadOpen}
					handleClose={(appId) => {
						if (appId) {
							navigateApp(appId);
						}
						setIsUploadOpen(false);
					}}
				/>
			)}
		</>
	);
};
