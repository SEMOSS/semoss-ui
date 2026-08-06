import { X } from "lucide-react";
import { Button } from "@semoss/ui/next";
import { STEP_TYPES } from "../../domain/automation-display";

interface HelpModalProps {
	open: boolean;
	onClose: () => void;
}

export function HelpModal({ open, onClose }: HelpModalProps) {
	if (!open) return null;

	return (
		<>
			{/* biome-ignore lint/a11y/noStaticElementInteractions: modal backdrop — click-outside dismiss, not a focusable control */}
			<div
				role="presentation"
				className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
				onClick={(e) => {
					if (e.target === e.currentTarget) onClose();
				}}
				onKeyDown={(e) => {
					if (e.key === "Escape") onClose();
				}}
			>
				<div className="relative mx-4 flex max-h-[80vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border bg-card shadow-xl">
					<div className="flex shrink-0 items-center justify-between border-b px-5 py-4">
						<h2 className="font-semibold text-sm">
							Automation reference
						</h2>
						<button
							type="button"
							onClick={onClose}
							className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
						>
							<X className="h-4 w-4" />
						</button>
					</div>

					<div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
						{/* Section 1: Step outputs */}
						<section>
							<h3 className="mb-1.5 font-semibold text-sm">
								Passing data between steps
							</h3>
							<p className="text-muted-foreground text-xs">
								Every step stores its result in an output
								variable. Use that result in any later step by
								typing{" "}
								<code className="rounded bg-muted px-1 font-mono">
									{/* biome-ignore lint/suspicious/noTemplateCurlyInString: intentional display */}
									{"${variableName}"}
								</code>{" "}
								in a field. The variable name is shown on each
								step's header.
							</p>
							<div className="mt-2 rounded-lg bg-muted/40 px-3 py-2">
								<p className="mb-1 text-[10px] text-muted-foreground uppercase tracking-wide">
									Example
								</p>
								<code className="font-mono text-[11px]">
									{/* biome-ignore lint/suspicious/noTemplateCurlyInString: intentional display */}
									{"Summarize this data: ${claims_data}"}
								</code>
							</div>
							<p className="mt-1.5 text-[11px] text-muted-foreground">
								Tip: type {"${"} in any field to see a list of
								available outputs from earlier steps.
							</p>
						</section>

						{/* Section 2: Config values */}
						<section>
							<h3 className="mb-1.5 font-semibold text-sm">
								Reusable settings
							</h3>
							<p className="text-muted-foreground text-xs">
								Store values you reuse across steps — like API
								keys, base URLs, or environment names — in the{" "}
								<strong>Config</strong> tab. Reference them
								anywhere with:
							</p>
							<div className="mt-2 rounded-lg bg-muted/40 px-3 py-2">
								<code className="font-mono text-[11px]">
									{/* biome-ignore lint/suspicious/noTemplateCurlyInString: intentional display */}
									{"${config.SETTING_NAME}"}
								</code>
							</div>
							<p className="mt-1.5 text-[11px] text-muted-foreground">
								Mark a setting as sensitive to encrypt it.
								Sensitive values are never shown in run history.
							</p>
						</section>

						{/* Section 3: Playground inputs */}
						<section>
							<h3 className="mb-1.5 font-semibold text-sm">
								Playground inputs
							</h3>
							<p className="text-muted-foreground text-xs">
								Some fields have a checkbox labelled "Let
								Playground fill this field." When checked, the
								AI assistant in the Playground can supply a
								value for that field each time the automation
								runs — useful for prompts or queries that change
								per request.
							</p>
							<p className="mt-1.5 text-[11px] text-muted-foreground">
								Your default value will be overwritten if the
								Playground provides one at runtime.
							</p>
						</section>

						{/* Section 4: Step types */}
						<section>
							<h3 className="mb-1.5 font-semibold text-sm">
								Step types
							</h3>
							<div className="space-y-2.5">
								{STEP_TYPES.map((s) => {
									const Icon = s.icon;
									return (
										<div
											key={s.type}
											className="flex items-start gap-3"
										>
											<span
												className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted ${s.color}`}
											>
												<Icon className="h-3.5 w-3.5" />
											</span>
											<div>
												<span className="font-medium text-xs">
													{s.label}
												</span>
												<span className="ml-2 text-[11px] text-muted-foreground">
													{s.description}
												</span>
											</div>
										</div>
									);
								})}
							</div>
						</section>
					</div>

					<div className="shrink-0 border-t px-5 py-3">
						<Button
							size="sm"
							variant="outline"
							onClick={onClose}
							className="w-full"
						>
							Close
						</Button>
					</div>
				</div>
			</div>
		</>
	);
}
