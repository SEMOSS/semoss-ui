import { useId, useState } from "react";
import { Navigate } from "react-router-dom";
import {
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Select as ShadcnSelect,
} from "@semoss/ui/next";
import { QueryWorkspace } from "@/components/query-workspace/query-workspace";
import { useRootStore, useSettings } from "@/hooks";

const DATABASE_OPTIONS = [
	{ label: "Audit Logs", value: "AuditLogs" },
	{ label: "Local Master Database", value: "LocalMasterDatabase" },
	{
		label: "Model Inference Logs Database",
		value: "ModelInferenceLogsDatabase",
	},
	{ label: "Prompt Database", value: "PromptDatabase" },
	{ label: "Scheduler", value: "scheduler" },
	{ label: "Security", value: "security" },
	{ label: "Themes", value: "themes" },
	{ label: "User Tracking Database", value: "UserTrackingDatabase" },
];

export const AdminQueryPage = () => {
	const { configStore } = useRootStore();
	const { adminMode } = useSettings();
	const dbSelectId = useId();
	const [selectedDatabase, setSelectedDatabase] = useState("");

	const databaseOptions = configStore.config.notificationEnabled
		? [
				...DATABASE_OPTIONS,
				{ label: "Notification", value: "Notification" },
			]
		: DATABASE_OPTIONS;

	if (!adminMode) {
		return <Navigate to={"/settings"} />;
	}

	return (
		<div className="flex w-full flex-col gap-4 pb-8">
			<div className="flex w-full max-w-md flex-col gap-2">
				<label
					htmlFor={dbSelectId}
					className="text-muted-foreground text-sm"
				>
					Database
				</label>
				<ShadcnSelect
					value={selectedDatabase}
					onValueChange={setSelectedDatabase}
				>
					<SelectTrigger id={dbSelectId} className="w-full">
						<SelectValue placeholder="Select database" />
					</SelectTrigger>
					<SelectContent>
						{databaseOptions.map((option, i) => (
							<SelectItem
								value={option.value}
								key={option.value}
								data-testid={`adminQueryPage-db-option-${i}`}
							>
								{option.label}
							</SelectItem>
						))}
					</SelectContent>
				</ShadcnSelect>
			</div>

			{selectedDatabase ? (
				<div className="h-[calc(100dvh-240px)] min-h-[480px] w-full overflow-hidden">
					<QueryWorkspace
						key={selectedDatabase}
						engine={selectedDatabase}
						mode="SQL"
						variant="admin"
					/>
				</div>
			) : (
				<div className="flex h-60 w-full items-center justify-center rounded-2xl border border-border/50 border-dashed bg-card/50 text-muted-foreground text-sm">
					Select a database to begin querying.
				</div>
			)}
		</div>
	);
};
