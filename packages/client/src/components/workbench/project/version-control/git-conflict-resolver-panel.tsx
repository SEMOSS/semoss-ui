import { GitMergeIcon } from "lucide-react";
import { useState } from "react";
import { useInsight, usePixel } from "@semoss/sdk/react";
import { FileCodeEditor } from "@semoss/shared";
import {
	Button,
	Muted,
	Skeleton,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	toast,
} from "@semoss/ui/next";
import { useProject, useWorkbench } from "@/hooks";
import type {
	WorkbenchComponent,
	WorkbenchPanelConfig,
} from "@/stores/workbench";
import type {
	ProjectGitConflictDiff,
	ProjectGitConflictResolution,
} from "./version-control.types";

export interface GitConflictResolverConfig {
	name: string;
	path: string;
}

const GitConflictResolverPanel: WorkbenchComponent<
	GitConflictResolverConfig
> = ({ config, close }) => {
	const { project } = useProject();
	const insight = useInsight();
	const [result, setResult] = useState<string>();
	const [isResolving, setIsResolving] = useState(false);
	const events = useWorkbench((state) => state.events.actions);
	const conflict = usePixel<ProjectGitConflictDiff>(
		`ProjectGitDiff(project=[${JSON.stringify(project.project_id)}], filePath=[${JSON.stringify(config.path)}], side=["CONFLICT"]);`,
	);
	const mode = { type: "APP" as const, app: project.project_id };
	const resultContent = result ?? conflict.data?.result ?? "";

	const resolveConflict = async (
		resolution: ProjectGitConflictResolution,
	) => {
		try {
			setIsResolving(true);
			const content =
				resolution === "MANUAL"
					? `, content=[${JSON.stringify(resultContent)}]`
					: "";
			await insight.actions.run(
				`ProjectGitResolveConflict(project=[${JSON.stringify(project.project_id)}], filePath=[${JSON.stringify(config.path)}], resolution=[${JSON.stringify(resolution)}]${content});`,
			);
			events.emit("git:status-changed", undefined);
			toast.success("Conflict resolved and staged");
			close();
		} catch (error) {
			console.error(error);
			toast.error("Failed to resolve conflict");
		} finally {
			setIsResolving(false);
		}
	};

	if (conflict.status === "INITIAL" || conflict.status === "LOADING") {
		return (
			<output className="flex h-full flex-col gap-3 p-4">
				<span className="sr-only">Loading merge conflict</span>
				<Skeleton className="h-9 w-full" />
				<Skeleton className="min-h-0 flex-1" />
			</output>
		);
	}

	if (conflict.status === "ERROR" || !conflict.data) {
		return (
			<div
				className="flex h-full flex-col items-center justify-center gap-3 p-6"
				role="alert"
			>
				<GitMergeIcon
					className="size-5 text-destructive"
					aria-hidden="true"
				/>
				<span className="font-medium text-sm">
					Unable to load merge conflict
				</span>
				<Muted>
					{conflict.error?.message ?? "The conflict is unavailable."}
				</Muted>
				<Button variant="outline" size="sm" onClick={conflict.refresh}>
					Retry
				</Button>
			</div>
		);
	}

	if (conflict.data.isBinary) {
		return (
			<div
				className="flex h-full flex-col items-center justify-center gap-3 p-6"
				role="alert"
			>
				<span className="font-medium text-sm">Binary conflict</span>
				<Muted>
					Choose ours or theirs to resolve this binary file.
				</Muted>
				<div className="flex gap-2">
					<Button
						disabled={isResolving}
						onClick={() => void resolveConflict("OURS")}
					>
						Accept ours
					</Button>
					<Button
						disabled={isResolving}
						onClick={() => void resolveConflict("THEIRS")}
					>
						Accept theirs
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="flex h-full min-h-0 flex-col">
			<div className="flex flex-wrap items-center gap-2 border-border border-b p-2">
				<span
					className="min-w-0 flex-1 truncate font-mono text-sm"
					title={config.path}
				>
					{config.path}
				</span>
				<Button
					size="sm"
					variant="outline"
					disabled={isResolving}
					onClick={() => void resolveConflict("OURS")}
				>
					Accept ours
				</Button>
				<Button
					size="sm"
					variant="outline"
					disabled={isResolving}
					onClick={() => void resolveConflict("THEIRS")}
				>
					Accept theirs
				</Button>
				<Button
					size="sm"
					variant="outline"
					disabled={isResolving}
					onClick={() => void resolveConflict("BOTH")}
				>
					Accept both
				</Button>
				<Button
					size="sm"
					disabled={isResolving}
					onClick={() => void resolveConflict("MANUAL")}
				>
					Mark resolved
				</Button>
			</div>
			<div className="grid min-h-0 flex-1 grid-cols-1 gap-2 p-2 lg:grid-cols-2">
				<Tabs defaultValue="ours" className="flex min-h-0 flex-col">
					<TabsList>
						<TabsTrigger value="ours">Ours</TabsTrigger>
						<TabsTrigger value="theirs">Theirs</TabsTrigger>
						<TabsTrigger value="base">Base</TabsTrigger>
					</TabsList>
					<TabsContent value="ours" className="min-h-0 flex-1">
						<FileCodeEditor
							mode={mode}
							path={config.path}
							value={conflict.data.ours ?? ""}
							hideToolbar
							readOnly
						/>
					</TabsContent>
					<TabsContent value="theirs" className="min-h-0 flex-1">
						<FileCodeEditor
							mode={mode}
							path={config.path}
							value={conflict.data.theirs ?? ""}
							hideToolbar
							readOnly
						/>
					</TabsContent>
					<TabsContent value="base" className="min-h-0 flex-1">
						<FileCodeEditor
							mode={mode}
							path={config.path}
							value={conflict.data.base ?? ""}
							hideToolbar
							readOnly
						/>
					</TabsContent>
				</Tabs>
				<div className="flex min-h-0 flex-col">
					<span className="pb-2 font-medium text-sm">Result</span>
					<div className="min-h-0 flex-1">
						<FileCodeEditor
							mode={mode}
							path={config.path}
							value={resultContent}
							onChange={(content) => setResult(content)}
							hideToolbar
						/>
					</div>
				</div>
			</div>
		</div>
	);
};

export const PROJECT_GIT_CONFLICT_RESOLVER_PANEL: WorkbenchPanelConfig<GitConflictResolverConfig> =
	{
		name: "Resolve Conflict",
		helpText: "Merge conflict resolver",
		icon: ({ className }) => <GitMergeIcon className={className} />,
		mount: "keepAlive",
		matches: (a, b) => a.path === b.path,
		content: GitConflictResolverPanel,
	};
