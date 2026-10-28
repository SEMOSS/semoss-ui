import { RefreshCw } from "lucide-react";
import { type ReactElement, useId, useState } from "react";
import {
	Alert,
	AlertDescription,
	AlertTitle,
	Button,
	Label,
	Muted,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Skeleton,
	Spinner,
	Switch,
} from "@semoss/ui/next";
import {
	SERVED_MODEL_CONTAINERS,
	type ServedModelContainer,
} from "@/api/model-serving";
import { SERVED_MODEL_CONTAINER_LABELS } from "./model-serving-labels";
import { ServedModelLogBlock } from "./served-model-log-block";
import { useServedModelLogs } from "./use-served-model-logs";

/** How many of the last lines to read */
const TAIL_CHOICES = ["100", "200", "500", "1000", "2000"] as const;

export interface ServedModelLogsProps {
	/** The model whose log to read; null reads nothing */
	servedModel: string | null;
}

const isContainer = (value: string): value is ServedModelContainer =>
	(SERVED_MODEL_CONTAINERS as readonly string[]).includes(value);

/**
 * The end of a served model's log: the model server's (vLLM) or the weight
 * download's, read on request, and every few seconds while followed.
 */
export function ServedModelLogs({
	servedModel,
}: ServedModelLogsProps): ReactElement {
	const id = useId();
	const [container, setContainer] =
		useState<ServedModelContainer>("kserve-container");
	const [tailLines, setTailLines] = useState("200");
	const [previous, setPrevious] = useState(false);
	const [includeAccessLogs, setIncludeAccessLogs] = useState(false);
	const [follow, setFollow] = useState(false);
	const { value, error, isLoading, isReading, refresh } = useServedModelLogs(
		servedModel,
		{
			container,
			tailLines: Number(tailLines),
			previous,
			includeAccessLogs,
			follow,
		},
	);
	const lineCount = value?.lines.length ?? 0;

	return (
		<div className="flex min-h-0 flex-col gap-3">
			<div
				role="toolbar"
				aria-label="Log options"
				className="flex flex-wrap items-end gap-3"
			>
				<div className="flex flex-col gap-1">
					<Label htmlFor={`${id}-container`}>Container</Label>
					<Select
						value={container}
						onValueChange={(next) => {
							if (isContainer(next)) setContainer(next);
						}}
					>
						<SelectTrigger
							id={`${id}-container`}
							size="sm"
							className="w-52"
						>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{SERVED_MODEL_CONTAINERS.map((name) => (
								<SelectItem key={name} value={name}>
									{SERVED_MODEL_CONTAINER_LABELS[name]}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="flex flex-col gap-1">
					<Label htmlFor={`${id}-lines`}>Lines</Label>
					<Select value={tailLines} onValueChange={setTailLines}>
						<SelectTrigger
							id={`${id}-lines`}
							size="sm"
							className="w-28"
						>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{TAIL_CHOICES.map((choice) => (
								<SelectItem key={choice} value={choice}>
									Last {choice}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<Button
					size="sm"
					variant="outline"
					onClick={refresh}
					disabled={!servedModel || isReading}
				>
					{isReading ? (
						<Spinner className="size-4" />
					) : (
						<RefreshCw className="size-4" aria-hidden />
					)}
					Refresh
				</Button>
			</div>
			<div className="flex flex-wrap gap-x-6 gap-y-2">
				<div className="flex items-center gap-2">
					<Switch
						id={`${id}-follow`}
						checked={follow}
						onCheckedChange={setFollow}
					/>
					<Label htmlFor={`${id}-follow`} className="font-normal">
						Follow
					</Label>
				</div>
				<div className="flex items-center gap-2">
					<Switch
						id={`${id}-previous`}
						checked={previous}
						onCheckedChange={setPrevious}
					/>
					<Label htmlFor={`${id}-previous`} className="font-normal">
						Before the last restart
					</Label>
				</div>
				{container === "kserve-container" ? (
					<div className="flex items-center gap-2">
						<Switch
							id={`${id}-access`}
							checked={includeAccessLogs}
							onCheckedChange={setIncludeAccessLogs}
						/>
						<Label htmlFor={`${id}-access`} className="font-normal">
							Each request too
						</Label>
					</div>
				) : null}
			</div>
			{isLoading ? (
				<div className="flex flex-col gap-2">
					<output className="sr-only">Loading the log...</output>
					<Skeleton className="h-64 w-full" />
				</div>
			) : error && !value ? (
				<Alert variant="destructive">
					<AlertTitle>The log could not be read</AlertTitle>
					<AlertDescription className="break-words">
						{error}
					</AlertDescription>
				</Alert>
			) : value ? (
				<div className="flex min-h-0 flex-col gap-1">
					{error ? (
						<Muted className="break-words text-xs">
							Showing the last log read: {error}
						</Muted>
					) : null}
					<Muted className="break-all text-xs">
						{[
							value.pod ? `Pod ${value.pod}` : null,
							lineCount === 1 ? "1 line" : `${lineCount} lines`,
							value.previous ? "before the last restart" : null,
						]
							.filter(Boolean)
							.join(" · ")}
					</Muted>
					<ServedModelLogBlock
						label={`Log of the ${SERVED_MODEL_CONTAINER_LABELS[container].toLowerCase()}`}
						lines={value.lines}
						className="max-h-96 min-h-32"
					/>
				</div>
			) : null}
		</div>
	);
}
