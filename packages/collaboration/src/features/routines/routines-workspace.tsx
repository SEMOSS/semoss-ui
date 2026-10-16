import { useState } from "react";
import { useInsight } from "@semoss/sdk/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@semoss/ui/next";
import officeImage from "@/assets/img/routines-office.webp";
import { CollaborationPage } from "@/features/collaboration/components/collaboration-page";
import { CollaborationPageHeader } from "@/features/collaboration/components/collaboration-page-header";
import { saveAgendaRoutine } from "./agenda-routine-api";
import { AgendaRoutineForm } from "./agenda-routine-form";
import { agendaRoutineSchema } from "./agenda-routine-schema";
import { saveInboxRoutine } from "./inbox-routine-api";
import { InboxRoutineForm } from "./inbox-routine-form";
import { inboxRoutineSchema } from "./inbox-routine-schema";
import { RoutineLoader } from "./routine-loader";

/** The owner's routines, one tab each; a tab loads its routine when it is opened. */
export function RoutinesWorkspace() {
	const { actions } = useInsight();
	const [hasOpenedAgendas, setHasOpenedAgendas] = useState(false);
	return (
		<CollaborationPage>
			<div className="flex min-w-0 flex-col gap-6">
				<Tabs
					defaultValue="inbox"
					className="gap-6"
					onValueChange={(value) => {
						if (value === "agendas") setHasOpenedAgendas(true);
					}}
				>
					<div className="relative isolate flex flex-col gap-6">
						<img
							src={officeImage}
							alt=""
							width={960}
							height={636}
							decoding="async"
							className="mask-l-from-50% mask-l-to-100% pointer-events-none absolute top-0 right-0 h-10 w-32 rounded-r-xl object-cover opacity-60 md:h-full md:w-2/5 dark:opacity-40"
						/>
						<CollaborationPageHeader
							title="Routines"
							description="Let your assistant take care of the repeat work. Your briefs appear here."
							className="relative mb-0 md:w-3/5 md:pr-6"
						/>
						<TabsList className="relative w-full sm:w-fit">
							<TabsTrigger value="inbox">
								Inbox daily brief
							</TabsTrigger>
							<TabsTrigger value="agendas">
								Weekly meeting agendas
							</TabsTrigger>
						</TabsList>
					</div>
					<TabsContent
						value="inbox"
						forceMount
						className="flex flex-col gap-6 data-[state=inactive]:hidden"
					>
						<RoutineLoader
							pixel="WorkGetInboxRoutine();"
							schema={inboxRoutineSchema}
						>
							{(routine, update) => (
								<InboxRoutineForm
									routine={routine}
									onSave={async (values) => {
										const saved = await saveInboxRoutine(
											actions,
											values,
										);
										update(saved);
										return saved;
									}}
								/>
							)}
						</RoutineLoader>
					</TabsContent>
					<TabsContent
						value="agendas"
						forceMount
						className="flex flex-col gap-6 data-[state=inactive]:hidden"
					>
						{hasOpenedAgendas && (
							<RoutineLoader
								pixel="WorkGetAgendaRoutine();"
								schema={agendaRoutineSchema}
							>
								{(routine, update) => (
									<AgendaRoutineForm
										routine={routine}
										onSave={async (values) => {
											const saved =
												await saveAgendaRoutine(
													actions,
													values,
												);
											update(saved);
											return saved;
										}}
									/>
								)}
							</RoutineLoader>
						)}
					</TabsContent>
				</Tabs>
			</div>
		</CollaborationPage>
	);
}
