import {
	ChevronRight,
	LayoutTemplateIcon,
	SearchIcon,
	UploadIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import type { Variable } from "@semoss/renderer";
import { STATE_VERSION } from "@semoss/renderer/version";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
	Button,
	Card,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
	H4,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	Large,
	P,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { NewAppModal } from "@/components/app";
import type { Template } from "@/components/app/templates";
import { LandingHeader } from "@/components/landing";
import { UploadProjectDialog } from "@/components/project";
import { NavbarHeader, NavbarLeft } from "@/components/shared";
import { useRootStore } from "@/hooks";
import { useNavigate } from "@/hooks/useNavigate";
import {
	BASE_APP_QUERIES,
	BASE_APP_VARIABLES,
	BASE_PAGE_BLOCKS,
} from "../../app/app.constants";

export const CreateAppPage = () => {
	const navigate = useNavigate();

	const { configStore } = useRootStore();
	const [search, setSearch] = useState<string>("");
	const [templates, setTemplates] = useState<Template[]>([]);
	const [isTemplatesLoading, setIsTemplatesLoading] = useState<boolean>(true);

	const cleanedSearch = search.trim().toLowerCase();
	const filteredTemplates = templates.filter(
		(template) =>
			template.name.toLowerCase().indexOf(cleanedSearch) !== -1 ||
			template.description.toLowerCase().indexOf(cleanedSearch) !== -1,
	);

	const [isUploadOpen, setIsUploadOpen] = useState(false);
	const [newAppOptions, setNewAppOptions] = useState<
		React.ComponentProps<typeof NewAppModal>["options"] | null
	>(null);

	const isNameOpen = !!newAppOptions;

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

	useEffect(() => {
		let isMounted = true;

		const loadTemplates = async () => {
			try {
				const { TEMPLATES } = await import(
					"@/components/app/templates"
				);
				if (!isMounted) {
					return;
				}

				setTemplates(TEMPLATES);
			} finally {
				if (isMounted) {
					setIsTemplatesLoading(false);
				}
			}
		};

		loadTemplates();

		return () => {
			isMounted = false;
		};
	}, []);

	const isRestricted = !configStore.isEngineOperationAvailable(
		"PROJECT",
		"add",
	);

	if (isRestricted) {
		return <Navigate to="/" replace />;
	}

	return (
		<>
			<NavbarLeft>
				<NavbarHeader />
			</NavbarLeft>
			<div className="flex flex-col gap-1">
				<Breadcrumb className="mb-4">
					<BreadcrumbList>
						<BreadcrumbItem>
							<BreadcrumbLink asChild>
								<Link to="../" className="text-inherit">
									App Catalog
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
				{isUploadOpen ? (
					<UploadProjectDialog
						open={isUploadOpen}
						type="APP"
						handleClose={(appId) => {
							if (appId) {
								navigateApp(appId);
							}
							setIsUploadOpen(false);
						}}
					/>
				) : null}

				{isNameOpen ? (
					<NewAppModal
						open={isNameOpen}
						options={newAppOptions}
						onClose={(appId) => {
							if (appId) {
								navigateApp(appId);
							} else {
								// close the modal
								setNewAppOptions(null);
							}
						}}
					/>
				) : null}

				<div className="flex flex-row items-center justify-between gap-2">
					<H4>New App</H4>
					<Button
						variant="outline"
						data-testid={"createAppSection-upload-btn"}
						onClick={() => setIsUploadOpen(true)}
					>
						<UploadIcon />
						Upload
					</Button>
				</div>
				<P className="mb-3 text-muted-foreground">
					In a platform where data drives decisions, apps are how data
					come to life. Whether you're a developer, data engineer, or
					product owner, this page helps you build, organize, and
					share interactive experiences — from drag-and-drop layouts
					to custom code and agent-powered workflows — so your team
					can turn data into action.
				</P>
				<div className="flex w-full flex-col gap-4">
					<LandingHeader
						onCreate={(type) => {
							if (type === "blocks") {
								setNewAppOptions({
									type: "blocks",
									state: {
										version: STATE_VERSION,
										variables: BASE_APP_VARIABLES as Record<
											string,
											Variable
										>,
										queries: BASE_APP_QUERIES,
										blocks: BASE_PAGE_BLOCKS,
										executionOrder: [],
									},
								});
							} else if (type === "code") {
								setNewAppOptions({
									type: "code",
								});
							} else if (type === "agent") {
								console.log(type);
								navigate("/app/new/prompt");
							}
						}}
					/>

					<div className="flex flex-col gap-4">
						<Large>Start build with a template</Large>
						<div className="flex h-full w-full flex-1 flex-col items-start overflow-hidden rounded-xl border-border bg-card shadow-sm">
							<div className="flex w-full flex-row gap-2 border-border bg-primary-foreground p-4">
								<InputGroup className="bg-background">
									<InputGroupInput
										placeholder="Search"
										value={search}
										onChange={(e) =>
											setSearch(e.target.value)
										}
									/>
									<InputGroupAddon>
										<SearchIcon />
									</InputGroupAddon>
								</InputGroup>
							</div>

							<div className="grid w-full grid-cols-1 gap-4 p-2 md:grid-cols-3">
								{isTemplatesLoading ? (
									<div className="col-span-full p-4 text-muted-foreground text-sm">
										Loading templates...
									</div>
								) : null}

								{!isTemplatesLoading &&
								filteredTemplates.length === 0 ? (
									<div className="col-span-full p-4 text-muted-foreground text-sm">
										No templates match your search.
									</div>
								) : null}

								{filteredTemplates.map((template) => (
									<Card
										key={template.name}
										className="relative w-full pt-0"
									>
										<div className="relative w-full overflow-hidden rounded-t-xl bg-accent">
											<div className="absolute inset-0 z-10 bg-black/50" />
											<img
												src={template.image}
												alt={template.name}
												className="aspect-video w-full object-cover"
											/>
										</div>
										<CardHeader>
											<CardTitle>
												{template.name}
											</CardTitle>
											<CardDescription className="line-clamp-3 h-15">
												{template.description}
											</CardDescription>
										</CardHeader>
										<CardFooter className="flex flex-row items-center justify-between gap-1">
											<Tooltip>
												<TooltipTrigger asChild>
													<LayoutTemplateIcon className="size-4 text-muted-foreground" />
												</TooltipTrigger>
												<TooltipContent>
													Drag and Drop App
												</TooltipContent>
											</Tooltip>
											<Button
												size="sm"
												onClick={(e) => {
													e.stopPropagation();

													setNewAppOptions({
														type: "blocks",
														state: template.state,
													});
												}}
											>
												Use Template
											</Button>
										</CardFooter>
									</Card>
								))}
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	);
};
