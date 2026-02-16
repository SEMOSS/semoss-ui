/* eslint-disable */
/** biome-ignore-all lint/nursery/useSortedClasses: using existing Tailwind order in this file */

import {
	ArrowLeftIcon,
	FolderPlusIcon,
	MessageSquarePlusIcon,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { usePixel } from "@semoss/sdk/react";
import {
	Badge,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	ScrollArea,
	Spinner,
	toast,
} from "@semoss/ui/next";
import { EmbedDocumentsOverlay } from "@/components/knowledge/embed-documents-overlay";
import { NewKnowledgeOverlay } from "@/components/knowledge/new-knowledge-mcp-overlay";
import { useGlobalBreadcrumbs } from "@/hooks";

type KnowledgeEngine = {
	app_id: string;
	app_name: string;
	description?: string;
	tag?: string[] | string;
};

type VectorDocument = {
	fileName: string;
	lastModified: string;
	fileSize: string;
};

/**
 * Knowledge detail page
 */
export const KnowledgeDetailPage = observer(() => {
	const navigate = useNavigate();
	const { knowledgeId } = useParams<{ knowledgeId: string }>();

	const getKnowledge = usePixel<KnowledgeEngine[]>(
		knowledgeId
			? `MyEngines(engine=["${knowledgeId}"], engineTypes=['VECTOR'], metaKeys=["description","tag"], userT=[true], limit=[1], offset=[0]);`
			: "",
		{ data: [] },
	);

	const knowledge =
		getKnowledge.status === "SUCCESS" ? getKnowledge.data?.[0] : null;

	const tags = useMemo(() => {
		const raw = knowledge?.tag;
		if (!raw) {
			return [] as string[];
		}
		return Array.isArray(raw) ? raw : [raw];
	}, [knowledge?.tag]);

	useGlobalBreadcrumbs({
		breadcrumbs: [
			{ name: "Home", path: "/" },
			{ name: "Knowledge Stores", path: "/knowledge" },
			{
				name:
					getKnowledge.status === "SUCCESS"
						? knowledge?.app_name || "Knowledge"
						: "Loading",
				path: `/knowledge/${knowledgeId}`,
			},
		],
	});

	const getDocuments = usePixel<VectorDocument[]>(
		knowledgeId
			? `ListDocumentsInVectorDatabase(engine=["${knowledgeId}"]);`
			: "",
		{ data: [] },
	);

	const [isEmbedOpen, setIsEmbedOpen] = useState(false);
	const [isEmbedExistingOpen, setIsEmbedExistingOpen] = useState(false);

	if (!knowledgeId) {
		return <Navigate to="/knowledge" replace />;
	}

	if (getKnowledge.status === "LOADING") {
		return (
			<div className="flex h-full w-full items-center justify-center">
				<Spinner />
			</div>
		);
	}

	if (getKnowledge.status === "ERROR") {
		return <Navigate to="/knowledge" replace />;
	}

	return (
		<div className="relative h-full w-full overflow-hidden">
			<div className="mx-auto flex h-full w-full max-w-5xl flex-col gap-6 px-12 pt-8 pb-4">
				<div className="flex items-start gap-3">
					<Button
						variant="ghost"
						size="icon"
						onClick={() => navigate(-1)}
						aria-label="Back"
					>
						<ArrowLeftIcon />
					</Button>

					<div className="flex-1 space-y-1">
						<h1 className="text-2xl font-semibold leading-none">
							{knowledge?.app_name || "Knowledge"}
						</h1>
						<p className="text-sm text-muted-foreground">
							{knowledge?.description || "No description"}
						</p>
						{tags.length > 0 ? (
							<div className="flex flex-wrap gap-2 pt-2">
								{tags.map((t) => (
									<Badge key={t} variant="secondary">
										{t}
									</Badge>
								))}
							</div>
						) : null}
					</div>

					<div className="flex gap-2">
						<Button asChild variant="outline">
							<Link
								to={`/new?knowledgeId=${encodeURIComponent(knowledgeId)}`}
							>
								<MessageSquarePlusIcon />
								New Chat
							</Link>
						</Button>

						<Button
							variant="default"
							onClick={() => setIsEmbedExistingOpen(true)}
						>
							<FolderPlusIcon />
							Embed documents
						</Button>
					</div>
				</div>

				<NewKnowledgeOverlay
					open={isEmbedOpen}
					onClose={(knowledgeCreated) => {
						setIsEmbedOpen(false);
						if (knowledgeCreated) {
							toast.info(
								"A new knowledge source was created. You can now select it to embed additional documents.",
							);
						}
					}}
				/>

				<EmbedDocumentsOverlay
					open={isEmbedExistingOpen}
					knowledgeId={knowledgeId}
					onClose={(success) => {
						setIsEmbedExistingOpen(false);
						if (success) {
							getDocuments.refresh?.();
						}
					}}
				/>

				<Card className="rounded-xl border-border bg-card shadow-sm">
					<CardHeader>
						<CardTitle>Documents</CardTitle>
						<CardDescription>
							Documents currently embedded in this knowledge
							source.
						</CardDescription>
					</CardHeader>
					<CardContent>
						{getDocuments.status === "LOADING" ? (
							<div className="text-sm text-muted-foreground">
								Loading documents…
							</div>
						) : getDocuments.status === "ERROR" ? (
							<div className="text-sm text-destructive">
								Failed to load documents.
							</div>
						) : getDocuments.data.length === 0 ? (
							<div className="text-sm text-muted-foreground">
								No documents found.
							</div>
						) : (
							<ScrollArea className="h-[50vh]">
								<div className="space-y-2 pr-3">
									{getDocuments.data.map((d) => (
										<div
											key={`${d.fileName}-${d.lastModified}`}
											className="flex items-center justify-between rounded-md border px-3 py-2"
										>
											<div className="min-w-0">
												<div
													className="truncate text-sm font-medium"
													title={d.fileName}
												>
													{d.fileName}
												</div>
												<div className="truncate text-xs text-muted-foreground">
													{d.lastModified} •{" "}
													{d.fileSize}
												</div>
											</div>
										</div>
									))}
								</div>
							</ScrollArea>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
});
