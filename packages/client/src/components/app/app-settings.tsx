import {
	RefreshCw as Cached,
	ChevronDown,
	ChevronUp,
	Link2 as InsertLink,
	User as Person,
	BadgeCheck as PublishedWithChanges,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
	Avatar,
	AvatarFallback,
	Button,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	FileDropzone,
	Input,
	Large,
	Spinner,
	Table,
	TableBody,
	TableCell,
	TableRow,
	toast,
} from "@semoss/ui/next";
import { uploadFile as uploadFileAPI } from "@/api";
import { Java } from "@/assets/img/Java";
import { usePixel, useRootStore, useSettings } from "@/hooks";
import { McpUsage } from "../shared/mcp-usage";

interface AppSettingsProps {
	id: string;
	condensed?: boolean;
}

type EditAppForm = {
	PROJECT_UPLOAD: File;
};

export const AppSettings = (props: AppSettingsProps) => {
	const { id, condensed = false } = props;
	const { monolithStore, configStore } = useRootStore();
	const { adminMode } = useSettings();
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [openMcp, setOpenMcp] = useState(false);

	const { handleSubmit, control, reset, watch } = useForm<EditAppForm>({
		defaultValues: { PROJECT_UPLOAD: null },
	});

	const uploadFile = watch("PROJECT_UPLOAD");

	const [portalReactors, setPortalReactors] = useState<{
		reactors: string[];
		lastCompiled?: string;
		compiledBy?: string;
	}>({ lastCompiled: "", reactors: [], compiledBy: "" });

	const [portalDetails, setPortalDetails] = useState<{
		project_is_published: boolean;
		project_portal_url?: string;
	}>({
		project_is_published: false,
		project_portal_url: "",
	});

	const getPortalDetails = usePixel<{
		project_is_published: boolean;
		project_portal_url?: string;
	}>(
		adminMode
			? `AdminGetProjectPortalDetails('${id}');`
			: `GetProjectPortalDetails('${id}');`,
	);

	// biome-ignore lint/correctness/useExhaustiveDependencies: getPortalReactors is defined after this hook
	useEffect(() => {
		if (getPortalDetails.status !== "SUCCESS") return;
		setPortalDetails({ ...getPortalDetails.data });
		getPortalReactors();
	}, [getPortalDetails.status, getPortalDetails.data]);

	if (getPortalDetails.status !== "SUCCESS") {
		return (
			<div className="flex h-full w-full items-center justify-center">
				<Spinner />
			</div>
		);
	}

	const getPortalReactors = () => {
		const pixelString = adminMode
			? `AdminGetProjectAvailableReactors(project=['${id}']);`
			: `GetProjectAvailableReactors(project=['${id}']);`;

		monolithStore
			.runQuery(pixelString)
			.then((response) => {
				const output = Array.isArray(response.pixelReturn[0].output)
					? (response.pixelReturn[0].output as string[])
					: [response.pixelReturn[0].output as string];
				const type = response.pixelReturn[0].operationType[0];

				if (type.indexOf("ERROR") > -1) {
					toast.error(String(output));
					return;
				}
				setPortalReactors({ ...portalReactors, reactors: output });
			})
			.catch((error) => toast.error(error));
	};

	const recompileReactors = ({ release }) => {
		const pixelString =
			release == null
				? `ReloadInsightClasses(project='${id}');`
				: `ReloadInsightClasses(project='${id}', release=true);`;

		monolithStore
			.runQuery(pixelString)
			.then((response) => {
				const output: string = response.pixelReturn[0].output as string;
				const type: string = response.pixelReturn[0].operationType[0];
				if (type.indexOf("ERROR") > -1) {
					toast.error(output);
					return;
				}
				toast.success(
					release == null
						? "Successfully recompiled"
						: "Successfully redeployed",
				);
			})
			.catch((error) => toast.error(error));
	};

	const publish = () => {
		monolithStore
			.runQuery(`PublishProject(project='${id}', release=true);`)
			.then((response) => {
				const output: string = response.pixelReturn[0].output as string;
				const type = response.pixelReturn[0].operationType[0];
				if (type.indexOf("ERROR") > -1) {
					toast.error(output);
					return;
				}
				setPortalDetails({
					...portalDetails,
					project_is_published: true,
					project_portal_url: output,
				});
				toast.success("Successfully published");
			})
			.catch((error) => toast.error(error));
	};

	const editApp = handleSubmit(async (data: EditAppForm) => {
		setIsLoading(true);
		try {
			const path = "version/assets/";
			await monolithStore.runQuery(
				`DeleteAsset(filePath=["${path}"], space=["${id}"]);`,
			);
			const upload = await uploadFileAPI(
				[data.PROJECT_UPLOAD],
				configStore.store.insightID,
				id,
				path,
			);
			await monolithStore.runQuery(
				`UnzipFile(filePath=["${`${path}${upload[0].fileName}`}"], space=["${id}"]);`,
			);
			await monolithStore.runQuery(
				`ReloadInsightClasses(project='${id}', release=true);`,
			);
			await monolithStore.runQuery(
				`PublishProject(project='${id}', release=true);`,
			);
			toast.success("Successfully Updated Project");
			reset();
		} catch (e) {
			console.error(e);
			toast.error(e.message);
		} finally {
			setIsLoading(false);
		}
	});

	if (condensed) {
		return (
			<div className="rounded-md bg-background p-4 shadow-sm">
				<div className="flex w-full flex-col gap-4">
					<div className="w-full">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<Cached className="size-4 text-muted-foreground" />
								<span className="font-medium text-sm">
									Publish Portal
								</span>
							</div>
							<Button
								variant="outline"
								size="sm"
								onClick={() => publish()}
							>
								Publish
							</Button>
						</div>
						<p className="mt-1 ml-6 text-muted-foreground text-sm">
							Publish the portal to generate a shareable link.
						</p>
						<div className="mt-2 ml-6">
							<div className="relative">
								<InsertLink className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground" />
								<Input
									className="pl-9"
									value={
										portalDetails.project_portal_url ?? ""
									}
									readOnly
								/>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="mb-10 flex w-full flex-col gap-4">
			{/* Portals */}
			<div className="w-full rounded-md bg-background shadow-[0px_5px_22px_0px_rgba(0,0,0,0.06)]">
				<div className="flex gap-4 p-4">
					<div className="flex w-1/2 flex-col gap-4">
						<h6 className="font-semibold text-base">Portals</h6>
					</div>
					<div className="flex w-1/2 flex-col gap-4">
						<div>
							<div className="mb-1 flex items-center gap-2">
								<Cached className="size-4 text-muted-foreground" />
								<span className="font-medium text-sm">
									Publish Portal
								</span>
							</div>
							<div className="mb-2 text-muted-foreground text-sm">
								Publish the portal to generate a shareable link.
							</div>
							<Button
								variant="outline"
								size="sm"
								disabled={
									!configStore.isEngineOperationAvailable(
										"PROJECT",
										"access",
									)
								}
								onClick={() => publish()}
							>
								<PublishedWithChanges className="size-4 text-primary" />
								<span className="text-primary">Publish</span>
							</Button>
							<div className="relative mt-2">
								<InsertLink className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground" />
								<Input
									className="pl-9"
									value={
										portalDetails.project_portal_url ?? ""
									}
									readOnly
								/>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Reactors */}
			<div className="w-full rounded-md bg-background shadow-[0px_5px_22px_0px_rgba(0,0,0,0.06)]">
				<div className="flex gap-4 p-4">
					<div className="flex w-1/2 flex-col gap-3">
						<h6 className="font-semibold text-base">Reactors</h6>
						<p className="text-muted-foreground text-sm">
							Custom reactors created for the portal.
						</p>
						<Button
							variant="outline"
							size="sm"
							onClick={() => recompileReactors({ release: null })}
						>
							Compile Changes on This Instance
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={() => recompileReactors({ release: true })}
						>
							Deploy and Persist Changes
						</Button>
						{portalReactors.lastCompiled && (
							<div className="flex items-center gap-2">
								<span className="text-muted-foreground text-sm">
									Last compiled by:
								</span>
								<Avatar className="size-6">
									<AvatarFallback>
										<Person className="size-3" />
									</AvatarFallback>
								</Avatar>
								<span className="text-sm">
									{portalReactors.compiledBy}
								</span>
								<span className="text-muted-foreground text-sm">
									on
								</span>
								<span className="text-sm">
									{portalReactors.lastCompiled}
								</span>
							</div>
						)}
					</div>
					<div className="w-1/2">
						{portalReactors.reactors.length > 0 ? (
							<Table className="rounded border border-border">
								<TableBody>
									{portalReactors.reactors.map((reactor) => (
										<TableRow key={reactor}>
											<TableCell>{reactor}</TableCell>
											<TableCell className="text-right">
												<Java />
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						) : (
							<div className="flex min-h-[120px] w-full items-center justify-center">
								<span className="text-muted-foreground text-sm">
									No reactors available.
								</span>
							</div>
						)}
					</div>
				</div>
			</div>

			{/* MCP Usage */}
			<div className="w-full rounded-md bg-background shadow-sm">
				<div className="block shrink-0 grow basis-0 p-4">
					<Collapsible open={openMcp} onOpenChange={setOpenMcp}>
						<div className="flex flex-row items-center justify-between">
							<div className="flex w-[19.75rem] flex-col items-start pb-2">
								<Large>MCP Usage</Large>
							</div>
							<CollapsibleTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									data-testid="mcp-usage-toggle"
								>
									{openMcp ? (
										<ChevronUp className="size-4" />
									) : (
										<ChevronDown className="size-4" />
									)}
								</Button>
							</CollapsibleTrigger>
						</div>
						<CollapsibleContent>
							<McpUsage id={id} />
						</CollapsibleContent>
					</Collapsible>
				</div>
			</div>

			{/* Update Project */}
			<div className="relative w-full rounded-md bg-background shadow-[0px_5px_22px_0px_rgba(0,0,0,0.06)]">
				{isLoading && (
					<div className="absolute inset-0 z-50 flex items-center justify-center rounded-md bg-background/60">
						<Spinner />
					</div>
				)}
				<div className="flex gap-4 p-4">
					<div className="w-1/2">
						<h6 className="font-semibold text-base">
							Update Project
						</h6>
					</div>
					<div className="w-1/2">
						<Controller
							name="PROJECT_UPLOAD"
							control={control}
							rules={{}}
							disabled={
								!configStore.isEngineOperationAvailable(
									"PROJECT",
									"access",
								)
							}
							render={({ field }) => (
								<FileDropzone
									multiple={false}
									value={field.value}
									disabled={isLoading}
									onChange={(newValues) =>
										field.onChange(newValues)
									}
								/>
							)}
						/>
						<div className="mt-4 flex items-center justify-center">
							<Button
								type="submit"
								disabled={isLoading || !uploadFile}
								onClick={editApp}
							>
								Update
							</Button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
