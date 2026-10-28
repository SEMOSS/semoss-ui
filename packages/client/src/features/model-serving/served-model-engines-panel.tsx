import { Link2, SquarePlus, Unlink } from "lucide-react";
import type { ReactElement } from "react";
import {
	Alert,
	AlertDescription,
	Button,
	H3,
	Muted,
	P,
	Skeleton,
	Spinner,
} from "@semoss/ui/next";
import type { ServedModelEngineLink } from "@/api/model-serving";
import { ServedModelEngineItem } from "./served-model-engine-item";
import type { ServedModelEngineGroup } from "./use-served-model-engines";

export interface ServedModelEnginesPanelProps {
	servedModel: string;
	group: ServedModelEngineGroup;
	isLoading: boolean;
	/** Why the engines could not be read */
	error: string | null;
	/** The engines being linked or unlinked, by id */
	busy: ReadonlySet<string>;
	onLink: (engine: ServedModelEngineLink) => void;
	onUnlink: (engine: ServedModelEngineLink) => void;
	onCreate: () => void;
}

const SECTION_TITLE = "font-medium text-base";

/**
 * A served model's engines: those linked to it, which say when it is stopped,
 * each with Unlink, and those that call it without the link, each with Link.
 */
export function ServedModelEnginesPanel({
	servedModel,
	group,
	isLoading,
	error,
	busy,
	onLink,
	onUnlink,
	onCreate,
}: ServedModelEnginesPanelProps): ReactElement {
	if (isLoading) {
		return (
			<div className="flex flex-col gap-2">
				<output className="sr-only">Loading the engines...</output>
				<Skeleton className="h-14 w-full" />
			</div>
		);
	}
	if (error) {
		return (
			<Alert variant="destructive">
				<AlertDescription className="break-words">
					The engines could not be read: {error}
				</AlertDescription>
			</Alert>
		);
	}
	return (
		<div className="flex flex-col gap-6">
			<section className="flex flex-col gap-2">
				<H3 className={SECTION_TITLE}>Linked Engines</H3>
				<Muted className="text-sm">
					They say when {servedModel} is stopped, instead of failing
					to connect.
				</Muted>
				{group.linked.length === 0 ? (
					<P className="text-sm">No engine is linked to it.</P>
				) : (
					<ul className="flex flex-col gap-2">
						{group.linked.map((engine) => (
							<ServedModelEngineItem
								key={engine.engineId}
								engine={engine}
								action={
									<Button
										size="sm"
										variant="outline"
										disabled={busy.has(engine.engineId)}
										onClick={() => onUnlink(engine)}
										aria-label={`Unlink ${engine.engineName}`}
									>
										{busy.has(engine.engineId) ? (
											<Spinner className="size-4" />
										) : (
											<Unlink
												className="size-4"
												aria-hidden
											/>
										)}
										Unlink
									</Button>
								}
							/>
						))}
					</ul>
				)}
			</section>

			{group.unlinked.length > 0 ? (
				<section className="flex flex-col gap-2">
					<H3 className={SECTION_TITLE}>
						Calling It Without the Link
					</H3>
					<Muted className="text-sm">
						These engines send the model's name or call its
						endpoint, but report a connection error while it is
						stopped.
					</Muted>
					<ul className="flex flex-col gap-2">
						{group.unlinked.map((engine) => (
							<ServedModelEngineItem
								key={engine.engineId}
								engine={engine}
								action={
									<Button
										size="sm"
										variant="outline"
										disabled={busy.has(engine.engineId)}
										onClick={() => onLink(engine)}
										aria-label={`Link ${engine.engineName}`}
									>
										{busy.has(engine.engineId) ? (
											<Spinner className="size-4" />
										) : (
											<Link2
												className="size-4"
												aria-hidden
											/>
										)}
										Link
									</Button>
								}
							/>
						))}
					</ul>
				</section>
			) : null}

			<div>
				<Button size="sm" variant="outline" onClick={onCreate}>
					<SquarePlus className="size-4" aria-hidden />
					{group.linked.length > 0
						? "Create Another Engine..."
						: "Create SEMOSS Engine..."}
				</Button>
			</div>
		</div>
	);
}
