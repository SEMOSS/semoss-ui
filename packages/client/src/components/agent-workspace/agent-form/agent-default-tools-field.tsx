import { ChevronRight } from "lucide-react";
import { useId, useState } from "react";
import { type Control, Controller, useWatch } from "react-hook-form";
import {
	Button,
	Checkbox,
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	Field,
	FieldDescription,
	FieldLabel,
	Switch,
} from "@semoss/ui/next";
import type { AgentFormValues } from "./types";

export interface AgentDefaultToolsFieldProps {
	/** React Hook Form control for the shared agent form. */
	control: Control<AgentFormValues>;
	/** Backend-authoritative tool catalog returned by GetWorkspace. */
	tools: {
		name: string;
		title?: string;
		description?: string;
	}[];
}

export const AgentDefaultToolsField = ({
	control,
	tools,
}: AgentDefaultToolsFieldProps) => {
	const idPrefix = useId();
	const [isOpen, setIsOpen] = useState(false);
	const masterEnabled = useWatch({
		control,
		name: "useDefaultAgentTools",
	});
	const isMasterEnabled = masterEnabled !== false;

	return (
		<div className="flex flex-col gap-4">
			<Controller
				name="useDefaultAgentTools"
				control={control}
				render={({ field }) => (
					<Field orientation="horizontal">
						<div>
							<FieldLabel htmlFor={`${idPrefix}-master`}>
								Enable built-in agent tools
							</FieldLabel>
							<FieldDescription>
								Include the deployment's default tools in
								addition to selected toolboxes.
							</FieldDescription>
						</div>
						<Switch
							id={`${idPrefix}-master`}
							checked={field.value}
							onCheckedChange={field.onChange}
						/>
					</Field>
				)}
			/>

			<Collapsible open={isOpen} onOpenChange={setIsOpen}>
				<CollapsibleTrigger className="flex items-center gap-1 text-left font-medium text-sm hover:underline">
					<ChevronRight
						aria-hidden="true"
						className={`size-4 transition-transform ${isOpen ? "rotate-90" : ""}`}
					/>
					Configure individual tools
				</CollapsibleTrigger>
				<CollapsibleContent className="pt-3">
					<Controller
						name="disabledDefaultTools"
						control={control}
						render={({ field }) => {
							const disabledNames = Array.from(
								new Set(field.value ?? []),
							);
							const updateToolEnabled = (
								name: string,
								enabled: boolean,
							) => {
								const next = new Set(disabledNames);
								if (enabled) next.delete(name);
								else next.add(name);
								field.onChange([...next]);
							};

							const disableAll = () => {
								const next = new Set(disabledNames);
								for (const tool of tools) {
									next.add(tool.name);
								}
								field.onChange([...next]);
							};

							return (
								<div className="flex flex-col gap-3">
									<div className="flex flex-wrap items-center justify-between gap-2">
										<FieldDescription>
											Uncheck a tool to disable its exact
											callable name.
										</FieldDescription>
										<div className="flex gap-1">
											<Button
												type="button"
												variant="ghost"
												size="sm"
												disabled={!isMasterEnabled}
												onClick={() =>
													field.onChange([])
												}
											>
												Enable all
											</Button>
											<Button
												type="button"
												variant="ghost"
												size="sm"
												disabled={!isMasterEnabled}
												onClick={disableAll}
											>
												Disable all
											</Button>
										</div>
									</div>

									<div
										className="grid gap-2 rounded-md border border-border p-3 sm:grid-cols-2"
										aria-disabled={!isMasterEnabled}
									>
										{tools.map((tool, index) => {
											const inputId = `${idPrefix}-tool-${index}`;
											const enabled =
												!disabledNames.includes(
													tool.name,
												);
											return (
												<label
													key={tool.name}
													htmlFor={inputId}
													className="flex cursor-pointer items-center gap-2 rounded-md border border-transparent p-2 hover:border-border"
												>
													<Checkbox
														id={inputId}
														checked={enabled}
														disabled={
															!isMasterEnabled
														}
														onCheckedChange={(
															next,
														) =>
															updateToolEnabled(
																tool.name,
																next === true,
															)
														}
													/>
													<div className="min-w-0 flex-1">
														<span className="font-medium text-sm">
															{tool.title ??
																tool.name}
															<code className="ml-2 font-normal text-muted-foreground text-xs">
																{tool.name}
															</code>
														</span>
														{tool.description && (
															<p className="text-muted-foreground text-xs leading-5">
																{
																	tool.description
																}
															</p>
														)}
													</div>
												</label>
											);
										})}
										{tools.length === 0 && (
											<FieldDescription>
												No built-in tools are available
												in this deployment.
											</FieldDescription>
										)}
									</div>
									{!isMasterEnabled && (
										<FieldDescription>
											Default tools are disabled. Your
											individual selections are retained.
										</FieldDescription>
									)}
								</div>
							);
						}}
					/>
				</CollapsibleContent>
			</Collapsible>
		</div>
	);
};
