/* eslint-disable */
/** biome-ignore-all lint/nursery/useSortedClasses: using existing Tailwind order in this file */

import { Folder, Info, Search } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useInsight } from "@semoss/sdk/react";
import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@semoss/ui/next";
import { NewKnowledgeOverlay } from "@/components/knowledge/new-knowledge-mcp-overlay";

type DocumentLibraryEngine = {
	name: string;
	subheader: string;
	description: string;
	id: string;
	app_name: string;
	tag: string[];
};

type EngineAsset = {
	name?: string;
	path?: string;
	type?: string;
	fileName?: string;
	lastModified?: string;
	fileSize?: string;
};

export const DocumentLibrary = () => {
	const centerId = useId();
	const navigate = useNavigate();

	const [search, setSearch] = useState("");
	const [centerFilter, setCenterFilter] = useState<string | null>(null);
	const [libraryTab, setLibraryTab] = useState<"all" | "global" | "mine">(
		"all",
	);
	const [isNewKnowledgeOpen, setIsNewKnowledgeOpen] = useState(false);

	const [documentsModalOpen, setDocumentsModalOpen] = useState(false);
	const [selectedEngine, setSelectedEngine] =
		useState<DocumentLibraryEngine | null>(null);
	const [engineAssets, setEngineAssets] = useState<EngineAsset[]>([]);
	const [isLoadingAssets, setIsLoadingAssets] = useState(false);
	const [assetsError, setAssetsError] = useState<string | null>(null);

	const { actions } = useInsight();
	const [data, setData] = useState([]);

	useEffect(() => {
		const getEngines = async () => {
			try {
				const result = await actions.run(
					`MyEngines ( engineTypes = [ 'VECTOR' ], metaKeys = ["description", "tag"])`,
				);

				const pixelData = result?.pixelReturn?.[0];
				if (!pixelData) {
					console.warn("No pixelReturn data found.");
					return;
				}

				const output = pixelData.output;
				setData([output]);
			} catch (error) {
				console.error("Error retrieving vectors", error);
			}
		};

		getEngines();
	}, [actions]);

	const centers = useMemo(() => {
		const tags = new Set<string>();
		data[0]?.forEach((item) => {
			const itemTags = Array.isArray(item?.tag)
				? item.tag
				: item?.tag
					? [item.tag]
					: [];
			itemTags.forEach((tag) => {
				if (tag) {
					tags.add(String(tag));
				}
			});
		});
		return Array.from(tags).sort();
	}, [data]);

	useEffect(() => {
		if (!documentsModalOpen || !selectedEngine?.id) {
			return;
		}

		let cancelled = false;
		setIsLoadingAssets(true);
		setAssetsError(null);
		setEngineAssets([]);

		void actions
			.run<
				{ fileName: string; lastModified: string; fileSize: string }[]
			>(`ListDocumentsInVectorDatabase(engine=["${selectedEngine.id}"]);`)
			.then((result) => {
				if (cancelled) {
					return;
				}

				const output = result?.pixelReturn?.[0]?.output;
				const assets = Array.isArray(output)
					? (output as EngineAsset[])
					: [];
				setEngineAssets(assets);
			})
			.catch((e) => {
				if (cancelled) {
					return;
				}
				setAssetsError(e instanceof Error ? e.message : String(e));
			})
			.finally(() => {
				if (cancelled) {
					return;
				}
				setIsLoadingAssets(false);
			});

		return () => {
			cancelled = true;
		};
	}, [actions, documentsModalOpen, selectedEngine?.id]);

	const formatted: DocumentLibraryEngine[] =
		data[0]?.reduce((acc, item) => {
			const name = item?.tag || item?.app_name || "Untitled";
			acc.push({
				name,
				subheader: item.database_name || "",
				description: item.description || "",
				id: item.app_id || "",
				app_name: item.app_name || item.tag || "",
				tag: Array.isArray(item?.tag)
					? item.tag
					: item?.tag
						? [item.tag]
						: [],
			});

			return acc;
		}, []) || [];

	const filteredItems = formatted
		.filter((item) => {
			// NOTE: Today we only have tags; until we have an explicit ownership/global flag,
			// use conservative heuristics:
			// - "mine": no FDA/center tags
			// - "global": has FDA or a known center tag
			if (libraryTab === "all") {
				return true;
			}

			const tags = Array.isArray(item.tag) ? item.tag : [];
			const lowerTags = tags
				.filter(Boolean)
				.map((t) => String(t).toLowerCase());

			const isGlobal = lowerTags.includes("fda")
				? true
				: centers.some((c) => lowerTags.includes(c.toLowerCase()));

			return libraryTab === "global" ? isGlobal : !isGlobal;
		})
		.filter((item) => {
			const matchesSearch =
				!search ||
				search.trim() === "" ||
				item?.tag?.some((a) =>
					a?.toLowerCase()?.includes(search?.toLowerCase()),
				);

			let matchesCenter = true;
			try {
				matchesCenter =
					!centerFilter ||
					item?.tag?.some((a) =>
						a?.toLowerCase()?.includes(centerFilter?.toLowerCase()),
					);
			} catch (e) {
				console.error(e);
			}

			let matchesName = true;

			try {
				matchesName = item?.name
					?.toLowerCase()
					?.includes(search?.toLowerCase());
			} catch (e) {
				console.error(e);
			}

			return (matchesSearch && matchesCenter) || matchesName;
		});

	const documentFiles = useMemo(() => {
		return engineAssets
			.filter((a) => a && typeof a === "object")
			.filter((a) => (a.type ? a.type !== "folder" : true));
	}, [engineAssets]);

	const getDisplayName = (f: EngineAsset) => {
		return (
			f.fileName ||
			f.name ||
			(f.path ? f.path.split(/[/\\]/).pop() : "") ||
			"Untitled"
		);
	};

	const getDisplayPath = (f: EngineAsset) => {
		return f.path || "";
	};

	return (
		<TooltipProvider>
			<div className="space-y-6 p-6">
				<NewKnowledgeOverlay
					open={isNewKnowledgeOpen}
					onClose={(knowledge) => {
						setIsNewKnowledgeOpen(false);

						// refresh list if a knowledge source was created
						if (knowledge) {
							void actions
								.run(
									`MyEngines ( engineTypes = [ 'VECTOR' ], metaKeys = ["description", "tag"],  metaFilters=[{"tag":${JSON.stringify(
										["FDA", ...centers],
									)}}])`,
								)
								.then((result) => {
									const pixelData = result?.pixelReturn?.[0];
									if (!pixelData) {
										return;
									}
									setData([pixelData.output]);
								});
						}
					}}
				/>

				<Dialog
					open={documentsModalOpen}
					onOpenChange={(open) => {
						setDocumentsModalOpen(open);
						if (!open) {
							setSelectedEngine(null);
							setEngineAssets([]);
							setAssetsError(null);
							setIsLoadingAssets(false);
						}
					}}
				>
					<DialogContent className="max-w-2xl">
						<DialogHeader>
							<DialogTitle>
								Documents
								{selectedEngine?.app_name
									? `: ${selectedEngine.app_name}`
									: ""}
							</DialogTitle>
							<DialogDescription>
								Files currently associated with this knowledge
								source.
							</DialogDescription>
						</DialogHeader>

						<div className="space-y-3">
							{isLoadingAssets ? (
								<div className="text-sm text-muted-foreground">
									Loading documents…
								</div>
							) : assetsError ? (
								<div className="text-sm text-destructive">
									{assetsError}
								</div>
							) : documentFiles.length === 0 ? (
								<div className="text-sm text-muted-foreground">
									No documents found.
								</div>
							) : (
								<ul className="divide-y rounded-md border">
									{documentFiles.map((f, idx) => (
										<li
											key={`${getDisplayPath(f) || getDisplayName(f)}-${idx}`}
											className="flex items-center justify-between gap-3 px-3 py-2"
										>
											<div className="min-w-0">
												<p className="truncate text-sm font-medium">
													{getDisplayName(f)}
												</p>
												{getDisplayPath(f) ? (
													<p className="truncate text-xs text-muted-foreground">
														{getDisplayPath(f)}
													</p>
												) : null}
											</div>
										</li>
									))}
								</ul>
							)}
						</div>
					</DialogContent>
				</Dialog>

				<Card className="rounded-xl border-border bg-card shadow-sm">
					<CardHeader className="pb-3">
						<CardTitle className="text-xl">
							Knowledge Stores{" "}
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="ghost"
										size="icon"
										className="h-8 w-8 text-muted-foreground"
									>
										<Info className="h-4 w-4" />
										<span className="sr-only">
											About Knowledge Stores
										</span>
									</Button>
								</TooltipTrigger>
								<TooltipContent
									side="right"
									className="max-w-sm"
								>
									<div className="space-y-2">
										<p className="font-medium">
											What's a Knowledge Store?
										</p>
										<p className="text-muted-foreground text-sm leading-relaxed">
											RAG (Retrieval-Augmented Generation)
											chat enhances AI conversations by
											grounding responses in trusted data.
											Choose from the libraries below to
											receive a response referencing those
											documents specifically.
										</p>
									</div>
								</TooltipContent>
							</Tooltip>
						</CardTitle>
						<CardDescription>
							Search, filter, and create new knowledge sources.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						<Tabs
							value={libraryTab}
							onValueChange={(v) =>
								setLibraryTab(v as "all" | "global" | "mine")
							}
						>
							<TabsList>
								<TabsTrigger value="all">All</TabsTrigger>
								<TabsTrigger value="global">
									Global Stores
								</TabsTrigger>
								<TabsTrigger value="mine">
									My Stores
								</TabsTrigger>
							</TabsList>
							<TabsContent value={libraryTab}>
								<div className="flex w-full flex-col gap-3">
									<div className="flex w-full flex-row flex-wrap items-center gap-2 items-bottom">
										<InputGroup className="min-w-[220px] flex-1 bg-background">
											<InputGroupInput
												placeholder="Search"
												value={search}
												onChange={(e) =>
													setSearch(e.target.value)
												}
											/>
											<InputGroupAddon>
												<Search />
											</InputGroupAddon>
										</InputGroup>

										<div className="grid gap-4 md:grid-cols-2">
											<div className="space-y-2">
												<Select
													value={centerFilter ?? ""}
													onValueChange={(v) =>
														setCenterFilter(
															v === "" ? null : v,
														)
													}
												>
													<SelectTrigger
														id={centerId}
													>
														<SelectValue placeholder="All Centers/Offices" />
													</SelectTrigger>
													<SelectContent>
														<SelectItem
															value={null}
														>
															All
														</SelectItem>
														{centers.map(
															(center) => (
																<SelectItem
																	key={center}
																	value={
																		center
																	}
																>
																	{center}
																</SelectItem>
															),
														)}
													</SelectContent>
												</Select>
											</div>
										</div>

										<Button
											variant="default"
											onClick={() =>
												setIsNewKnowledgeOpen(true)
											}
										>
											Create Knowledge Source
										</Button>
									</div>
								</div>
							</TabsContent>
						</Tabs>
					</CardContent>
				</Card>

				{/* Cards */}
				{filteredItems.length > 0 ? (
					<div className="max-h-[70vh] overflow-y-auto pr-1">
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
							{filteredItems.map((item, index) => (
								<button
									type="button"
									key={item.app_name || item.id || index}
									className="text-left"
									onClick={() => {
										navigate(`/knowledge/${item.id}`);
									}}
								>
									<Card className="group flex h-full flex-col transition hover:bg-muted/40">
										<CardHeader className="space-y-1">
											<CardTitle className="line-clamp-1 text-base">
												{item.name}
											</CardTitle>
											<CardDescription className="line-clamp-2">
												{item.subheader ||
													"No description"}
											</CardDescription>
										</CardHeader>
										{/* <CardContent className="flex items-center justify-between gap-2">
											<div className="flex gap-1">
												<Tooltip>
													<TooltipTrigger asChild>
														<Button
															variant="ghost"
															size="icon"
															className="h-8 w-8 text-muted-foreground"
															onClick={(e) => {
																e.stopPropagation();
																setSelectedEngine(
																	item,
																);
																setDocumentsModalOpen(
																	true,
																);
															}}
															aria-label="View documents"
														>
															<Folder className="h-4 w-4" />
														</Button>
													</TooltipTrigger>
													<TooltipContent>
														View documents
													</TooltipContent>
												</Tooltip>
											</div>
										</CardContent> */}

										<hr
											className="w-full"
											style={{
												borderTop:
													"1px solid var(--base-border, #E5E5E5)",
											}}
										/>

										<CardContent className="mt-auto px-6 ">
											<div className="flex items-center justify-between gap-2">
												<Tooltip>
													<TooltipTrigger asChild>
														<Button
															variant="outline"
															size="sm"
															onClick={(e) => {
																e.stopPropagation();
																setSelectedEngine(
																	item,
																);
																setDocumentsModalOpen(
																	true,
																);
															}}
															aria-label="View documents"
														>
															<Folder />
														</Button>
													</TooltipTrigger>
													<TooltipContent>
														View documents
													</TooltipContent>
												</Tooltip>

												<Button
													size="sm"
													variant="outline"
													onClick={(e) => {
														e.stopPropagation();
														navigate(
															`/new?knowledgeId=${encodeURIComponent(item.id)}`,
														);
													}}
												>
													New Chat
												</Button>
											</div>
										</CardContent>
									</Card>
								</button>
							))}
						</div>
					</div>
				) : (
					<div className="rounded-lg border border-dashed p-10 text-center">
						<p className="text-muted-foreground">
							No document libraries found matching your criteria.
						</p>
					</div>
				)}
			</div>
		</TooltipProvider>
	);
};
