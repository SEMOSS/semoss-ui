import { slugifyIdentifier } from "@semoss/utility/identifier";
import { capitalize } from "@semoss/utility/text";
import type {
	ServedModelContainer,
	ServedModelLastAction,
	ServedModelState,
} from "@/api/model-serving";

/** The words for each lifecycle state */
export const SERVED_MODEL_STATE_LABELS: Record<ServedModelState, string> = {
	READY: "Ready",
	STARTING: "Starting",
	WAITING_FOR_GPU: "Waiting for GPU",
	FAILED: "Failed",
	STOPPING: "Stopping",
	STOPPED: "Stopped",
	REMOVING: "Removing",
};

/** The words for each step of a start (ServedModelPhase) */
export const SERVED_MODEL_PHASE_LABELS: Record<string, string> = {
	CREATING: "Creating the pod",
	PULLING_INIT_IMAGE: "Pulling the download image",
	DOWNLOADING_WEIGHTS: "Downloading the weights",
	PULLING_IMAGE: "Pulling the model server image",
	LOADING_WEIGHTS: "Loading the weights",
	COMPILING: "Compiling the model",
	WARMING: "Warming up",
	FINISHING: "Starting the API server",
};

/** The words for each cause of a failure (ServedModelFailure.Cause) */
export const SERVED_MODEL_FAILURE_LABELS: Record<string, string> = {
	DOWNLOAD_FAILED: "Download failed",
	DOWNLOAD_OOM: "Download ran out of memory",
	IMAGE_PULL: "Image cannot be pulled",
	CONFIG: "Configuration problem",
	MODEL_CRASH: "Model server crashed",
	MODEL_OOM: "Model server ran out of memory",
	STARTUP_TIMEOUT: "Start timed out",
	UNSCHEDULABLE: "Cannot be scheduled",
};

export const SERVED_MODEL_CONTAINER_LABELS: Record<
	ServedModelContainer,
	string
> = {
	"kserve-container": "Model server (vLLM)",
	"storage-initializer": "Weight download",
};

/** The words for the last action recorded on a model */
const LAST_ACTION_LABELS: Record<string, string> = {
	start: "Started",
	stop: "Stopped",
	define: "Defined",
};

/** The states in which a model changes by itself, so the page reads it again soon */
const CHANGING_STATES: ReadonlySet<string> = new Set([
	"STARTING",
	"WAITING_FOR_GPU",
	"STOPPING",
	"REMOVING",
]);

/** Names KServe accepts for an InferenceService that SEMOSS defines */
export const SERVED_MODEL_NAME_PATTERN = /^[a-z]([-a-z0-9]*[a-z0-9])?$/;

/** SEMOSS keeps served model names short enough for the Services KServe derives from them */
export const MAX_SERVED_MODEL_NAME_LENGTH = 45;

/**
 * The words for a value from one of the label maps; a value a newer backend
 * sends and the map does not know is shown in words.
 */
export function servingLabel(
	labels: Record<string, string>,
	value: string | null | undefined,
): string {
	if (!value) {
		return "Unknown";
	}
	return labels[value] ?? capitalize(value.replace(/_/g, " "));
}

/** Whether a model in this state is on its way somewhere and will change by itself. */
export function isChangingState(state: string): boolean {
	return CHANGING_STATES.has(state);
}

/** Whether a model in this state holds, or is trying to get, the GPU. */
export function isRunningState(state: string): boolean {
	return (
		state === "READY" ||
		state === "STARTING" ||
		state === "WAITING_FOR_GPU" ||
		state === "FAILED"
	);
}

/**
 * A duration in words, rounded to what matters for a model start:
 * "45 s", "3 min 20 s", "1 h 5 min".
 */
export function formatServingDuration(seconds: number): string {
	const total = Math.max(0, Math.round(seconds));
	if (total < 60) {
		return `${total} s`;
	}
	const minutes = Math.floor(total / 60);
	if (minutes < 60) {
		const rest = total % 60;
		return rest === 0 ? `${minutes} min` : `${minutes} min ${rest} s`;
	}
	const hours = Math.floor(minutes / 60);
	const restMinutes = minutes % 60;
	return restMinutes === 0 ? `${hours} h` : `${hours} h ${restMinutes} min`;
}

/** How long a start may still take, in words; null when the backend gave no estimate. */
export function formatEta(etaSeconds: number | null): string | null {
	if (etaSeconds === null) {
		return null;
	}
	if (etaSeconds < 60) {
		return "under a minute left";
	}
	return `about ${formatServingDuration(Math.ceil(etaSeconds / 60) * 60)} left`;
}

/** "Started by Ada Admin", or "Started" when no user was recorded. */
export function describeLastAction(lastAction: ServedModelLastAction): string {
	const verb = servingLabel(LAST_ACTION_LABELS, lastAction.action);
	const who = lastAction.userName || lastAction.user;
	return who ? `${verb} by ${who}` : verb;
}

/** Where a catalog entry's weights come from, by the scheme of its storage URI. */
export function describeStorage(storageUri: string | null): string {
	if (!storageUri) {
		return "Unknown";
	}
	if (storageUri.startsWith("hf://")) {
		return "Hugging Face";
	}
	if (storageUri.startsWith("s3://")) {
		return "MinIO";
	}
	if (storageUri.startsWith("pvc://")) {
		return "Cluster volume";
	}
	return storageUri.split("://")[0] || "Unknown";
}

/**
 * The served model name a catalog entry suggests: its repository name in
 * lowercase words joined by dashes, such as "olmo-2-0425-1b-instruct" for
 * "allenai/OLMo-2-0425-1B-Instruct".
 */
export function deriveServedModelName(catalogEntry: string): string {
	const repository = catalogEntry.split("/").pop() ?? catalogEntry;
	let name = slugifyIdentifier(repository);
	if (!/^[a-z]/.test(name)) {
		name = `model-${name}`;
	}
	return name.slice(0, MAX_SERVED_MODEL_NAME_LENGTH).replace(/-+$/, "");
}

/** Why a name cannot be a served model's, or null when it can. */
export function servedModelNameProblem(
	name: string,
	existing: readonly string[],
): string | null {
	if (name.length > MAX_SERVED_MODEL_NAME_LENGTH) {
		return `Use at most ${MAX_SERVED_MODEL_NAME_LENGTH} characters.`;
	}
	if (!SERVED_MODEL_NAME_PATTERN.test(name)) {
		return "Use lowercase letters, digits and dashes, starting with a letter and not ending with a dash.";
	}
	if (existing.includes(name)) {
		return `A served model named ${name} already exists.`;
	}
	return null;
}
