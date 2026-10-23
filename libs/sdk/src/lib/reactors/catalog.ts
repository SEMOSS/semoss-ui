/** Internal per-domain contracts; only buildPixel exposes their inference. */
import type { AgentReactorCatalog } from "./agent";
import type { AlgorithmsReactorCatalog } from "./algorithms";
import type { AppReactorCatalog } from "./app";
import type { AuthReactorCatalog } from "./auth";
import type { AutomationReactorCatalog } from "./automation";
import type { BlocksReactorCatalog } from "./blocks";
import type { ClusterReactorCatalog } from "./cluster";
import type { CodeexecReactorCatalog } from "./codeexec";
import type { CollaborationReactorCatalog } from "./collaboration";
import type { CollaborationOutputTypes } from "./collaboration-output-types";
import type { ConnectorsReactorCatalog } from "./connectors";
import type { CoreReactorCatalog } from "./core";
import type { DatabaseReactorCatalog } from "./database";
import type { DateReactorCatalog } from "./date";
import type { EngineReactorCatalog } from "./engine";
import type { ExportReactorCatalog } from "./export";
import type { ExpressionReactorCatalog } from "./expression";
import type { FederationReactorCatalog } from "./federation";
import type { FormsReactorCatalog } from "./forms";
import type { FrameReactorCatalog } from "./frame";
import type { FunctionReactorCatalog } from "./function";
import type { GuardrailReactorCatalog } from "./guardrail";
import type { ImagesReactorCatalog } from "./images";
import type { ImplementationOutputTypes } from "./implementation-output-types";
import type { ImportsReactorCatalog } from "./imports";
import type { InsightsReactorCatalog } from "./insights";
import type { InterceptorReactorCatalog } from "./interceptor";
import type { LegacyReactorCatalog } from "./legacy";
import type { LivekitReactorCatalog } from "./livekit";
import type { LoggingReactorCatalog } from "./logging";
import type { MapReactorCatalog } from "./map";
import type { MasterdatabaseReactorCatalog } from "./masterdatabase";
import type { MgmtReactorCatalog } from "./mgmt";
import type { ModelReactorCatalog } from "./model";
import type { NotificationReactorCatalog } from "./notification";
import type { PanelReactorCatalog } from "./panel";
import type { PlannerReactorCatalog } from "./planner";
import type { PlatformReactorCatalog } from "./platform";
import type { PlaygroundReactorCatalog } from "./playground";
import type { PlaywrightReactorCatalog } from "./playwright";
import type { PortalsReactorCatalog } from "./portals";
import type { ProjectReactorCatalog } from "./project";
import type { PromptReactorCatalog } from "./prompt";
import type { QsReactorCatalog } from "./qs";
import type { QueryOutputTypes } from "./query-output-types";
import type { ResourceOutputTypes } from "./resource-output-types";
import type { RuntimeReactorCatalog } from "./runtime";
import type { Sablecc2ReactorCatalog } from "./sablecc2";
import type { SchedulerReactorCatalog } from "./scheduler";
import type { SecurityReactorCatalog } from "./security";
import type { SheetReactorCatalog } from "./sheet";
import type { StorageReactorCatalog } from "./storage";
import type { TaskReactorCatalog } from "./task";
import type { TaxReactorCatalog } from "./tax";
import type { TcpReactorCatalog } from "./tcp";
import type { TestReactorCatalog } from "./test";
import type { UserReactorCatalog } from "./user";
import type { UsertrackingReactorCatalog } from "./usertracking";
import type { UtilReactorCatalog } from "./util";
import type { UtilsReactorCatalog } from "./utils";
import type { VectorReactorCatalog } from "./vector";
import type { VenvReactorCatalog } from "./venv";
import type { VerifiedReactorCatalog } from "./verified-contracts";
import type { WorkflowReactorCatalog } from "./workflow";

type BaseReactorCatalog = AgentReactorCatalog &
	AlgorithmsReactorCatalog &
	AppReactorCatalog &
	AuthReactorCatalog &
	AutomationReactorCatalog &
	BlocksReactorCatalog &
	ClusterReactorCatalog &
	CodeexecReactorCatalog &
	CollaborationReactorCatalog &
	ConnectorsReactorCatalog &
	CoreReactorCatalog &
	DatabaseReactorCatalog &
	DateReactorCatalog &
	EngineReactorCatalog &
	ExportReactorCatalog &
	ExpressionReactorCatalog &
	FederationReactorCatalog &
	FormsReactorCatalog &
	FrameReactorCatalog &
	FunctionReactorCatalog &
	GuardrailReactorCatalog &
	ImagesReactorCatalog &
	ImportsReactorCatalog &
	InsightsReactorCatalog &
	InterceptorReactorCatalog &
	LegacyReactorCatalog &
	LivekitReactorCatalog &
	LoggingReactorCatalog &
	MapReactorCatalog &
	MasterdatabaseReactorCatalog &
	MgmtReactorCatalog &
	ModelReactorCatalog &
	NotificationReactorCatalog &
	PanelReactorCatalog &
	PlannerReactorCatalog &
	PlatformReactorCatalog &
	PlaygroundReactorCatalog &
	PlaywrightReactorCatalog &
	PortalsReactorCatalog &
	ProjectReactorCatalog &
	PromptReactorCatalog &
	QsReactorCatalog &
	RuntimeReactorCatalog &
	Sablecc2ReactorCatalog &
	SchedulerReactorCatalog &
	SecurityReactorCatalog &
	SheetReactorCatalog &
	StorageReactorCatalog &
	TaskReactorCatalog &
	TaxReactorCatalog &
	TcpReactorCatalog &
	TestReactorCatalog &
	UserReactorCatalog &
	UsertrackingReactorCatalog &
	UtilReactorCatalog &
	UtilsReactorCatalog &
	VectorReactorCatalog &
	VenvReactorCatalog &
	WorkflowReactorCatalog;

/** Audited input and output contracts replace conservative source inventory entries. */
type InputCatalog = Omit<BaseReactorCatalog, keyof VerifiedReactorCatalog> &
	VerifiedReactorCatalog;

type ImplementationOutputs = CollaborationOutputTypes &
	ImplementationOutputTypes &
	QueryOutputTypes &
	ResourceOutputTypes;

/** Refine only output: preserve named/positional inputs and omission evidence. */
export type ReactorCatalog = {
	[Name in keyof InputCatalog]: Name extends keyof ImplementationOutputs
		? Omit<InputCatalog[Name], "output"> & {
				output: ImplementationOutputs[Name];
			}
		: InputCatalog[Name];
};
