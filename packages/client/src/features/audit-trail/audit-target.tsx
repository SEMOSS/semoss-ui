import {
	Box,
	Brain,
	CalendarClock,
	Cpu,
	Database,
	FileText,
	FolderKanban,
	HardDrive,
	History,
	KeyRound,
	Layers,
	LayoutGrid,
	ListChecks,
	type LucideIcon,
	Server,
	Settings,
	ShieldCheck,
	Sparkles,
	SquareFunction,
	User,
	Users,
	Workflow,
} from "lucide-react";
import type { ReactElement } from "react";
import { AppCatalogAvatar, EngineSubtypeIcon } from "@semoss/shared";
import { AuditIdentity } from "./audit-identity";
import { AUDIT_TARGET_LABELS, auditLabel, auditText } from "./audit-labels";

/** The icon of each kind of thing an event is on */
const TARGET_ICONS: Readonly<Record<string, LucideIcon>> = {
	USER: User,
	GROUP: Users,
	PROJECT: LayoutGrid,
	INSIGHT: FileText,
	WORKSPACE: FolderKanban,
	ENGINE: Box,
	DATABASE: Database,
	MODEL: Brain,
	VECTOR: Layers,
	STORAGE: HardDrive,
	FUNCTION: SquareFunction,
	GUARDRAIL: ShieldCheck,
	VENV: Cpu,
	AUTOMATION: Workflow,
	SKILL: Sparkles,
	JOB: CalendarClock,
	API_KEY: KeyRound,
	PLATFORM: Server,
	PLATFORM_CONFIG: Settings,
	PERMISSION_BATCH: ListChecks,
	AUDIT: History,
};

/** The target types that are engines, whose kind and provider pick a logo */
const ENGINE_TARGETS = new Set([
	"ENGINE",
	"DATABASE",
	"MODEL",
	"VECTOR",
	"STORAGE",
	"FUNCTION",
	"GUARDRAIL",
	"VENV",
]);

/** A detail line under the name */
const DETAIL_CLASS = "truncate text-muted-foreground text-xs";

export interface AuditTargetProps {
	/**
	 * The event: its stored TARGET_TYPE, TARGET_ID and TARGET_NAME, the catalog's
	 * TARGET_DISPLAY_NAME, TARGET_ENGINE_TYPE and TARGET_ENGINE_SUBTYPE, and the
	 * affected user, whose login type is a user target's
	 */
	event: Readonly<Record<string, unknown>>;
}

/**
 * What an event was on. A user is shown as every person is (`AuditIdentity`); an
 * engine by its logo, an app by its image, and anything else by its kind's icon
 * in a circle, with its name as the catalog has it now, else as the event
 * recorded it, else its id, and under it its kind and its id. An event on the
 * whole platform, such as a change to the General Platform Limit, is shown as
 * the platform.
 */
export function AuditTarget({ event }: AuditTargetProps): ReactElement {
	const targetType = auditText(event.TARGET_TYPE);
	const id = auditText(event.TARGET_ID);
	const name =
		auditText(event.TARGET_DISPLAY_NAME) || auditText(event.TARGET_NAME);
	if (targetType === "USER" && (id || name)) {
		// the affected user is the target user on account events, with their login
		const subjectId = auditText(event.SUBJECT_USER_ID);
		return (
			<AuditIdentity
				id={id}
				name={name || auditText(event.SUBJECT_USER_NAME)}
				type={
					subjectId && subjectId === id
						? auditText(event.SUBJECT_USER_TYPE)
						: ""
				}
			/>
		);
	}
	const isEngine = ENGINE_TARGETS.has(targetType);
	// the catalog knows an engine's kind even when the event recorded only ENGINE
	const engineType = auditText(event.TARGET_ENGINE_TYPE);
	const kind = isEngine && engineType ? engineType : targetType;
	const label = auditLabel(AUDIT_TARGET_LABELS, kind);
	if (!label && !id && !name) {
		return (
			<span className="text-muted-foreground text-sm">Not recorded</span>
		);
	}
	const title = name || id || label;
	const Icon = TARGET_ICONS[kind] ?? Box;
	return (
		<span className="flex min-w-0 items-center gap-2.5">
			{isEngine && kind !== "ENGINE" ? (
				<EngineSubtypeIcon
					engineType={kind}
					engineSubtype={
						auditText(event.TARGET_ENGINE_SUBTYPE) || undefined
					}
					alt=""
					className="size-8 shrink-0 rounded object-contain"
				/>
			) : targetType === "PROJECT" && id ? (
				<AppCatalogAvatar
					projectId={id}
					name={title}
					className="size-8 shrink-0 rounded-md text-xs"
				/>
			) : (
				<span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
					<Icon className="size-4" aria-hidden />
				</span>
			)}
			<span className="flex min-w-0 flex-col">
				<span className="truncate font-medium text-sm" title={title}>
					{title}
				</span>
				{label && title !== label ? (
					<span className={DETAIL_CLASS}>{label}</span>
				) : null}
				{id && title !== id ? (
					<span className={DETAIL_CLASS} title={`id: ${id}`}>
						id: {id}
					</span>
				) : null}
			</span>
		</span>
	);
}
