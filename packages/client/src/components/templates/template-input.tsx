import { SendIcon } from "lucide-react";
import { type KeyboardEvent, useState } from "react";
import { AgentStore } from "@semoss/sdk";
import { Button, Spinner, Textarea, toast } from "@semoss/ui/next";
import {
	type BuildPlan,
	type BuildTargetKind,
	cloneSkillFromTemplate,
	createBlankCodeProject,
	createBlankNotebookProject,
	createBlankWorkspaceProject,
	createBuildRoom,
	createEmptyDatabase,
	createProjectFromTemplate,
	getDefaultWorkbenchAssistantModel,
	planBuildFromPrompt,
	prepareBuildRoom,
	resolveFreeName,
} from "@/api";
import { TYPE_TO_ROUTE } from "@/constants";
import { useSession } from "@/hooks";
import { useNavigate } from "@/hooks/useNavigate";
import {
	ASSISTANT_HANDOFF_PARAM,
	storeAssistantHandoff,
} from "@/utility/assistant-handoff";

/** Where the prompt flow has got to, for the spinner and the status line. */
type TemplatePromptStatus = "idle" | "planning" | "creating" | "building";

/** Default agent id when the plan picked none — matches the assistant store. */
const DEFAULT_AGENT_ID = "app-builder";

/** Turn count a run gets, matching the assistant store's own default. */
const RUN_MAX_TURNS = 30;

/** A route the client knows how to land on. */
type RoutableType = keyof typeof TYPE_TO_ROUTE;

/**
 * What was actually created. The type can differ from the planned one — a SKILL
 * with no matching template becomes a blank CODE app — and the route has to
 * follow what exists, not what was asked for.
 */
interface CreateOutcome {
	/** Id of the new project or engine. */
	id: string;
	/** Type actually created, used to pick the route. */
	type: RoutableType;
	/** Route segment after the id. Engines have no /edit route. */
	route: "edit" | "workbench";
}

/**
 * How one planned target is turned into something real.
 *
 * `create` types are built here and receive the prompt in their workbench
 * assistant. `redirect` types are stubs: their backing `Create*Engine` reactor
 * requires a connection details map — host, credentials, provider config —
 * which a prompt cannot supply, so the user is sent to the real form instead of
 * having something half-configured created for them.
 */
type TargetHandler =
	| {
			mode: "create";
			/** PROJECT and ENGINE names live in separate namespaces. */
			kind: BuildTargetKind;
			create: (
				plan: BuildPlan,
				name: string,
				insightId: string,
			) => Promise<CreateOutcome>;
	  }
	| { mode: "redirect"; to: string; reason: string };

/** A blank CODE app — the fallback whenever no template matched. */
const createBlankApp = async (
	name: string,
	insightId: string,
): Promise<CreateOutcome> => ({
	id: await createBlankCodeProject(name, insightId),
	// Deliberately CODE, not the planned type: that is what was created, so
	// that is where the user has to land.
	type: "CODE",
	route: "edit",
});

const createBlankNotebook = async (
	name: string,
	insightId: string,
): Promise<CreateOutcome> => ({
	id: await createBlankNotebookProject(name, insightId),
	type: "NOTEBOOK",
	route: "edit",
});

const createBlankWorkspace = async (
	name: string,
	insightId: string,
): Promise<CreateOutcome> => ({
	id: await createBlankWorkspaceProject(name, insightId),
	type: "WORKSPACE",
	route: "edit",
});

/** Clone the plan's template, or create the correct blank project. */
const createProject = async (
	plan: BuildPlan,
	name: string,
	insightId: string,
): Promise<CreateOutcome> => {
	if (!plan.templateId) {
		if (plan.targetType === "NOTEBOOK") {
			return createBlankNotebook(name, insightId);
		}
		if (plan.targetType === "WORKSPACE") {
			return createBlankWorkspace(name, insightId);
		}
		return createBlankApp(name, insightId);
	}

	return {
		id: await createProjectFromTemplate(name, plan.templateId, insightId),
		type: plan.targetType as RoutableType,
		route: "edit",
	};
};

/** SKILL templates do not go through CreateAppFromTemplate. */
const createSkill = async (
	plan: BuildPlan,
	name: string,
	insightId: string,
): Promise<CreateOutcome> => {
	if (!plan.templateId) {
		return createBlankApp(name, insightId);
	}

	return {
		id: await cloneSkillFromTemplate(name, plan.templateId, insightId),
		type: "SKILL",
		route: "edit",
	};
};

const PROJECT_HANDLER = {
	mode: "create",
	kind: "PROJECT",
	create: createProject,
} as const satisfies TargetHandler;

const TARGET_HANDLERS: Record<string, TargetHandler> = {
	// ---- projects ----
	CODE: PROJECT_HANDLER,
	NOTEBOOK: PROJECT_HANDLER,
	WORKSPACE: PROJECT_HANDLER,
	SKILL: { mode: "create", kind: "PROJECT", create: createSkill },

	// ---- engines ----
	DATABASE: {
		mode: "create",
		kind: "ENGINE",
		create: async (_plan, name, insightId) => ({
			id: await createEmptyDatabase(name, "", insightId),
			type: "DATABASE",
			// Engines have no /edit route; their assistant lives on /workbench.
			route: "workbench",
		}),
	},

	// ---- engine stubs ----
	// TODO: prefill each form from the prompt, then hand the prompt to the new
	// engine's workbench assistant the way DATABASE does.
	VECTOR: {
		mode: "redirect",
		to: "/vector/new",
		reason: "a vector database needs connection details",
	},
	STORAGE: {
		mode: "redirect",
		to: "/storage/new",
		reason: "a storage engine needs connection details",
	},
	FUNCTION: {
		mode: "redirect",
		to: "/function/new",
		reason: "a function engine needs connection details",
	},
	GUARDRAIL: {
		mode: "redirect",
		to: "/guardrail/new",
		reason: "a guardrail needs connection details",
	},
	// MODEL's workbench has no assistant at all — it uses MODEL_CHAT instead.
	MODEL: {
		mode: "redirect",
		to: "/model/new",
		reason: "a model needs provider and credential details",
	},
};

/** Words too generic to make a useful name out of. */
const NAME_STOPWORDS = new Set([
	"the",
	"and",
	"for",
	"with",
	"that",
	"this",
	"build",
	"create",
	"make",
	"need",
	"want",
	"help",
	"new",
	"app",
	"application",
	"please",
	"could",
	"would",
	"should",
	"about",
	"using",
	"use",
]);

/**
 * Last-resort name when the backend suggests none. Also the sanitizer for the
 * one it does suggest: the result is interpolated into the placeholder portal's
 * HTML, so anything outside letters, digits and spaces has to go.
 *
 * @name toSafeName
 * @param value - Suggested name, or the raw prompt to derive one from.
 * @return A safe, non-empty name.
 */
const toSafeName = (value: string): string => {
	const cleaned = value
		.replace(/[^\p{L}\p{N} ]/gu, " ")
		.replace(/\s+/g, " ")
		.trim();
	if (!cleaned) {
		return "New Project";
	}

	const words = cleaned
		.split(" ")
		.filter((word) => !NAME_STOPWORDS.has(word.toLowerCase()))
		.slice(0, 6);
	const name = (words.length > 0 ? words : cleaned.split(" ")).join(" ");

	return name.slice(0, 60).trim() || "New Project";
};

/**
 * Prompt box above the template grid. The user describes what they want; the
 * backend picks the project or engine type, the closest template and the best
 * agent; and this creates it, navigates to its workbench, and hands the
 * original prompt to that workbench's assistant as the first message.
 *
 * The whole sequence lives in `handleSubmit` on purpose — it is one linear
 * flow with one failure story, and splitting it across hooks would only spread
 * that story out.
 *
 * @name TemplateInput
 * @return The prompt box.
 */
export const TemplateInput = () => {
	const navigate = useNavigate();
	const insightId = useSession((state) => state.insightID);

	const [value, setValue] = useState("");
	const [status, setStatus] = useState<TemplatePromptStatus>("idle");

	const isBusy = status !== "idle";
	const isSendDisabled = !value.trim() || isBusy || !insightId;

	const handleSubmit = async () => {
		const prompt = value.trim();
		if (!prompt || isBusy || !insightId) {
			return;
		}

		setStatus("planning");
		try {
			// 1. Plan. Non-fatal: if the planner is unavailable the user still
			// gets a blank app with their prompt in it, rather than an error.
			let plan: BuildPlan | null = null;
			try {
				plan = await planBuildFromPrompt(prompt, insightId);
			} catch (error) {
				console.error(error);
				toast.warning(
					"Couldn't work out what to build — starting from a blank app.",
				);
			}

			const targetType = plan?.targetType ?? "CODE";
			const handler = TARGET_HANDLERS[targetType] ?? PROJECT_HANDLER;

			// 2. Stub types: send the user to the form that can actually
			// collect what the engine needs.
			if (handler.mode === "redirect") {
				toast.info(
					`Opening the ${targetType.toLowerCase()} form — ${handler.reason}.`,
				);
				navigate(handler.to);
				return;
			}

			const resolvedPlan: BuildPlan = {
				targetKind: plan?.targetKind ?? "PROJECT",
				// An unrecognised type falls back to CODE along with the
				// handler, so the route below can never be undefined.
				targetType: TARGET_HANDLERS[targetType] ? targetType : "CODE",
				name: plan?.name ?? "",
				templateId: plan?.templateId ?? null,
				templateName: plan?.templateName ?? null,
				agentId: plan?.agentId ?? null,
				agentName: plan?.agentName ?? null,
			};

			// 3. Name. The user never typed one, so a duplicate-name error
			// would be a confusing thing to show them.
			setStatus("creating");
			const name = await resolveFreeName(
				toSafeName(resolvedPlan.name || prompt),
				handler.kind,
				insightId,
			);

			// 4. Create. Fatal — there would be nothing to navigate to.
			const outcome = await handler.create(resolvedPlan, name, insightId);

			const destination = `${TYPE_TO_ROUTE[outcome.type]}/${outcome.id}/${outcome.route}`;

			// 5. Start the run before navigating so the workbench can reattach to
			// the room and run immediately. Non-fatal: if any of this fails they
			// still land on what was created.
			setStatus("building");
			try {
				const isEngine = handler.kind === "ENGINE";
				const model =
					await getDefaultWorkbenchAssistantModel(insightId);
				if (!model) {
					throw new Error("No text-generation model is available");
				}

				const roomId = await createBuildRoom(
					name,
					isEngine ? null : outcome.id,
					insightId,
				);
				await prepareBuildRoom(
					{
						roomId,
						targetId: outcome.id,
						targetName: name,
						isEngine,
						modelId: model.engine_id,
						agent: resolvedPlan.agentId
							? {
									workspace_id: resolvedPlan.agentId,
									name: resolvedPlan.agentName ?? undefined,
								}
							: null,
					},
					insightId,
				);

				const agentRun = await AgentStore.start(
					{
						roomId,
						command: prompt,
						engine: model.engine_id,
						harnessType: "semoss",
						agentId: resolvedPlan.agentId ?? DEFAULT_AGENT_ID,
						maxTurns: RUN_MAX_TURNS,
						maxReflections: 0,
						paramValues: isEngine
							? {}
							: {
									project: outcome.id,
									// Matches the code workbench, so the first
									// turn does not stall asking permission to
									// edit the files it just created.
									permissionMode: "acceptEdits",
								},
					},
					insightId,
				);

				const handoffId = storeAssistantHandoff({
					prompt,
					roomId,
					runId: agentRun.runId,
				});
				navigate(
					handoffId
						? `${destination}?${ASSISTANT_HANDOFF_PARAM}=${handoffId}`
						: destination,
				);
			} catch (error) {
				console.error(error);
				toast.warning(
					"It's ready, but the assistant couldn't be started — ask it there instead.",
				);
				navigate(destination);
			}
			// Status is left as it is — this page is unmounting.
		} catch (error) {
			console.error(error);
			toast.error(
				error instanceof Error && error.message
					? error.message
					: "Couldn't create that. Please try again.",
			);
			setStatus("idle");
		}
	};

	const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
		if (event.nativeEvent.isComposing) {
			return;
		}
		if (event.key === "Enter" && !event.shiftKey) {
			event.preventDefault();
			void handleSubmit();
		}
	};

	return (
		<form
			onSubmit={(event) => {
				event.preventDefault();
				void handleSubmit();
			}}
			className="w-full"
			data-testid="templateInput-form-root"
		>
			<div className="flex w-full flex-col overflow-hidden rounded-md border border-input bg-card transition-[color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50">
				<Textarea
					value={value}
					aria-label="Describe what you want to build"
					placeholder="Describe what you want to build"
					disabled={isBusy}
					onChange={(event) => setValue(event.target.value)}
					onKeyDown={handleKeyDown}
					className="max-h-40 min-h-20 w-full resize-none rounded-md border-0 bg-card px-4 py-3 shadow-none focus-visible:ring-0"
					data-testid="templateInput-prompt-txt"
				/>

				<div className="flex items-center justify-end gap-2 bg-card p-2">
					<Button
						type="submit"
						size="icon-sm"
						disabled={isSendDisabled}
						aria-label="Create this from my description"
						data-testid="templateInput-send-btn"
					>
						{isBusy ? <Spinner className="size-4" /> : <SendIcon />}
					</Button>
				</div>
			</div>
		</form>
	);
};
