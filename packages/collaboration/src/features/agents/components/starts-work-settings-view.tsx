import { Check, Clock3, Mail, MessageSquare, Plus, Trash2 } from "lucide-react";
import { useId } from "react";
import {
	Button,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Switch,
} from "@semoss/ui/next";
import { FormSection } from "@/features/agents/components/form-section";
import type { Agent } from "@/types/agent";
import type { Origin } from "@/types/origin";

type UpdateAgent = <Key extends keyof Agent>(
	key: Key,
	value: Agent[Key],
) => void;
type RuleSource = Exclude<Origin, "You">;

export function StartsWorkSettingsView({
	agent,
	ruleName,
	ruleSource,
	condition,
	addingRule,
	editingRule,
	ruleTime,
	ruleZone,
	ruleCadence,
	onRuleNameChange,
	onRuleSourceChange,
	onConditionChange,
	onRuleTimeChange,
	onRuleZoneChange,
	onRuleCadenceChange,
	onAddRule,
	onEditRule,
	onStartNewRule,
	onCancelRule,
	onUpdate,
}: {
	agent: Agent;
	ruleName: string;
	ruleSource: RuleSource;
	condition: string;
	addingRule: boolean;
	editingRule: string;
	ruleTime: string;
	ruleZone: string;
	ruleCadence: string;
	onRuleNameChange: (value: string) => void;
	onRuleSourceChange: (value: RuleSource) => void;
	onConditionChange: (value: string) => void;
	onRuleTimeChange: (value: string) => void;
	onRuleZoneChange: (value: string) => void;
	onRuleCadenceChange: (value: string) => void;
	onAddRule: () => void;
	onEditRule: (rule: Agent["triggers"][number]) => void;
	onStartNewRule: () => void;
	onCancelRule: () => void;
	onUpdate: UpdateAgent;
}) {
	const ruleNameId = useId();
	const ruleSourceId = useId();
	const ruleCadenceId = useId();
	const ruleTimeId = useId();
	const ruleZoneId = useId();
	const ruleConditionId = useId();
	return (
		<div className="space-y-7">
			<FormSection
				title="Starts work when"
				description="Different starting points. The same agent and conversation."
			>
				<div className="flex items-center gap-3 border-b pb-5">
					<span className="flex size-9 items-center justify-center rounded-lg bg-accent text-link">
						<MessageSquare className="size-4" />
					</span>
					<span className="flex-1">
						<strong className="block font-medium text-sm">
							You start a conversation
						</strong>
						<span className="mt-1 block text-muted-foreground text-xs">
							Always available
						</span>
					</span>
					<Check className="size-4 text-primary" />
				</div>
				{agent.triggers.map((rule) => (
					<div
						key={rule.id}
						className="flex items-start gap-3 border-b py-5"
					>
						<span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
							{rule.source === "Email" ? (
								<Mail className="size-4" />
							) : (
								<Clock3 className="size-4" />
							)}
						</span>
						<span className="min-w-0 flex-1">
							<button
								type="button"
								className="block text-left font-medium text-sm hover:text-link"
								onClick={() => onEditRule(rule)}
							>
								{rule.name}
							</button>
							<span className="mt-1 block text-muted-foreground text-xs leading-5">
								{rule.condition}
							</span>
							<span className="mt-1 inline-block text-muted-foreground text-xs">
								{rule.source} ·{" "}
								{rule.enabled ? "Enabled in preview" : "Paused"}
							</span>
						</span>
						<Switch
							checked={rule.enabled}
							aria-label={`Enable ${rule.name}`}
							onCheckedChange={(enabled) =>
								onUpdate(
									"triggers",
									agent.triggers.map((item) =>
										item.id === rule.id
											? { ...item, enabled }
											: item,
									),
								)
							}
						/>
						<Button
							type="button"
							aria-label={`Remove ${rule.name}`}
							variant="ghost"
							size="icon-sm"
							onClick={() =>
								onUpdate(
									"triggers",
									agent.triggers.filter(
										(item) => item.id !== rule.id,
									),
								)
							}
						>
							<Trash2 />
						</Button>
					</div>
				))}
				<Button
					type="button"
					variant="outline"
					className="mt-5"
					onClick={onStartNewRule}
				>
					<Plus />
					Add starting rule
				</Button>
			</FormSection>
			{addingRule && (
				<FormSection
					title={
						editingRule ? "Edit starting rule" : "New starting rule"
					}
				>
					<div className="space-y-4">
						<div className="grid gap-4 sm:grid-cols-2">
							<div className="space-y-2">
								<label
									htmlFor={ruleNameId}
									className="font-medium text-sm"
								>
									Name
								</label>
								<Input
									id={ruleNameId}
									value={ruleName}
									onChange={(event) =>
										onRuleNameChange(event.target.value)
									}
									placeholder="e.g. Morning briefing"
								/>
							</div>
							<div className="space-y-2">
								<label
									htmlFor={ruleSourceId}
									className="font-medium text-sm"
								>
									Starts from
								</label>
								<Select
									value={ruleSource}
									onValueChange={(value) =>
										onRuleSourceChange(value as RuleSource)
									}
								>
									<SelectTrigger
										id={ruleSourceId}
										className="w-full"
									>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="Scheduled">
											Scheduled
										</SelectItem>
										<SelectItem value="Email">
											Email
										</SelectItem>
										<SelectItem value="Calendar">
											Calendar
										</SelectItem>
										<SelectItem value="Webhook">
											Webhook
										</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
						{ruleSource === "Scheduled" ? (
							<div className="grid gap-4 sm:grid-cols-3">
								<div className="space-y-2">
									<label
										htmlFor={ruleCadenceId}
										className="font-medium text-xs"
									>
										Repeats
									</label>
									<Select
										value={ruleCadence}
										onValueChange={onRuleCadenceChange}
									>
										<SelectTrigger id={ruleCadenceId}>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="Weekdays">
												Weekdays
											</SelectItem>
											<SelectItem value="Daily">
												Daily
											</SelectItem>
											<SelectItem value="Weekly">
												Weekly
											</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className="space-y-2">
									<label
										htmlFor={ruleTimeId}
										className="font-medium text-xs"
									>
										Time
									</label>
									<Input
										id={ruleTimeId}
										type="time"
										value={ruleTime}
										onChange={(event) =>
											onRuleTimeChange(event.target.value)
										}
									/>
								</div>
								<div className="space-y-2">
									<label
										htmlFor={ruleZoneId}
										className="font-medium text-xs"
									>
										Timezone
									</label>
									<Input
										id={ruleZoneId}
										value={ruleZone}
										onChange={(event) =>
											onRuleZoneChange(event.target.value)
										}
									/>
								</div>
							</div>
						) : (
							<div className="space-y-2">
								<label
									htmlFor={ruleConditionId}
									className="font-medium text-sm"
								>
									{ruleSource === "Email"
										? "Email condition"
										: ruleSource === "Calendar"
											? "Calendar condition"
											: "Event name"}
								</label>
								<Input
									id={ruleConditionId}
									placeholder={
										ruleSource === "Email"
											? "Subject contains Portugal"
											: ruleSource === "Calendar"
												? "30 minutes before a leadership meeting"
												: "quarterly-report.ready"
									}
									value={condition}
									onChange={(event) =>
										onConditionChange(event.target.value)
									}
								/>
							</div>
						)}
						<div className="flex gap-2">
							<Button type="button" onClick={onAddRule}>
								<Check />
								{editingRule ? "Update rule" : "Add rule"}
							</Button>
							<Button
								type="button"
								variant="outline"
								onClick={onCancelRule}
							>
								Cancel
							</Button>
						</div>
					</div>
				</FormSection>
			)}
			<p className="text-muted-foreground text-xs leading-5">
				Preview settings only. No schedules, email hooks, calendar
				subscriptions or webhooks are connected.
			</p>
		</div>
	);
}
