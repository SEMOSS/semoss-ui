import { CodeBlock } from "../code-block";
import { DocPage } from "../doc-page";

export const OverviewDoc = () => {
	return (
		<DocPage
			title="@semoss/chat"
			description="A shared chat component library extracted from playground's chat UI — a headless state machine plus a presentational layer, proven against a real SEMOSS backend."
		>
			<section className="flex flex-col gap-3">
				<h2 className="font-semibold text-foreground text-xl">
					Install
				</h2>
				<p className="text-muted-foreground text-sm">
					Inside this workspace (semoss-ui), add it as an ordinary
					dependency:
				</p>
				<CodeBlock
					language="json"
					code={`{
  "dependencies": {
    "@semoss/chat": "workspace:*"
  }
}`}
				/>
				<p className="text-muted-foreground text-sm">
					<code className="rounded bg-muted px-1 py-0.5">
						@semoss/chat
					</code>{" "}
					has no dependency on{" "}
					<code className="rounded bg-muted px-1 py-0.5">
						@semoss/shared
					</code>{" "}
					— its only real dependencies are{" "}
					<code className="rounded bg-muted px-1 py-0.5">
						@semoss/sdk
					</code>{" "}
					and{" "}
					<code className="rounded bg-muted px-1 py-0.5">
						@semoss/ui
					</code>
					, both already built for external consumption. That's what
					makes it genuinely usable outside this repository — e.g. by
					an app on its own registry, installing{" "}
					<code className="rounded bg-muted px-1 py-0.5">
						@semoss/chat
					</code>{" "}
					as a real npm dependency rather than a workspace link.
					Actually publishing it to a registry (versioning, CI,
					credentials) is a separate, not-yet-done follow-up — this
					only removes the dependency that made it impossible.
				</p>
			</section>

			<section className="flex flex-col gap-3">
				<h2 className="font-semibold text-foreground text-xl">
					Two entry points
				</h2>
				<p className="text-muted-foreground text-sm">
					<code className="rounded bg-muted px-1 py-0.5">
						@semoss/chat
					</code>{" "}
					is headless (hooks, transport, types) — no JSX, no{" "}
					<code className="rounded bg-muted px-1 py-0.5">
						@semoss/ui
					</code>{" "}
					dependency required to import it.{" "}
					<code className="rounded bg-muted px-1 py-0.5">
						@semoss/chat/components
					</code>{" "}
					is the presentational layer, built on{" "}
					<code className="rounded bg-muted px-1 py-0.5">
						@semoss/ui
					</code>
					's tokens/components — the host app needs{" "}
					<code className="rounded bg-muted px-1 py-0.5">
						@semoss/ui/globals.css
					</code>{" "}
					imported and typically a{" "}
					<code className="rounded bg-muted px-1 py-0.5">
						ThemeProvider
					</code>
					.
				</p>
			</section>

			<section className="flex flex-col gap-3">
				<h2 className="font-semibold text-foreground text-xl">
					Quick start
				</h2>
				<p className="text-muted-foreground text-sm">
					The simplest possible integration — batteries included.
				</p>
				<CodeBlock
					code={`import { ChatPanel } from "@semoss/chat/components";
import { InsightProvider } from "@semoss/sdk/react";
import { ThemeProvider } from "@semoss/ui/next";

export function App() {
  return (
    <InsightProvider>
      <ThemeProvider defaultTheme="light">
        <ChatPanel options={{ engineId: "your-engine-id" }} />
      </ThemeProvider>
    </InsightProvider>
  );
}`}
				/>
			</section>

			<section className="flex flex-col gap-3">
				<h2 className="font-semibold text-foreground text-xl">
					The override model
				</h2>
				<p className="text-muted-foreground text-sm">
					Five layers, weakest to strongest — the same conventions
					already used across @semoss/ui, not a new paradigm. Each
					layer is a real escape hatch to the one above it, so a host
					only reaches for headless when it genuinely needs to throw
					away the styled UI entirely.
				</p>
				<ol className="flex flex-col gap-2 text-sm">
					<li>
						<strong>1. Design tokens</strong> — @semoss/ui's own CSS
						variables (
						<code className="rounded bg-muted px-1 py-0.5">
							--primary
						</code>
						,{" "}
						<code className="rounded bg-muted px-1 py-0.5">
							--accent
						</code>
						,{" "}
						<code className="rounded bg-muted px-1 py-0.5">
							--background
						</code>
						). Restyling chat means restyling these tokens, same as
						any other @semoss/ui-based app.
					</li>
					<li>
						<strong>2. className / style</strong> — every exported
						component accepts{" "}
						<code className="rounded bg-muted px-1 py-0.5">
							className
						</code>
						, merged via{" "}
						<code className="rounded bg-muted px-1 py-0.5">
							cn()
						</code>
						, so the caller always wins.
					</li>
					<li>
						<strong>3. Composition</strong> — separable pieces
						(EngineSelect, PromptOptimizer, McpMenuButton) compose
						into slots like ChatInput's{" "}
						<code className="rounded bg-muted px-1 py-0.5">
							trailingActions
						</code>{" "}
						instead of being baked into the core.
					</li>
					<li>
						<strong>4. Custom renderers</strong> —{" "}
						<code className="rounded bg-muted px-1 py-0.5">
							MessageList
						</code>
						's{" "}
						<code className="rounded bg-muted px-1 py-0.5">
							renderMessage
						</code>{" "}
						swaps the per-message renderer entirely while keeping
						scroll/typing behavior.
					</li>
					<li>
						<strong>5. Headless escape hatch</strong> —{" "}
						<code className="rounded bg-muted px-1 py-0.5">
							useChat()
						</code>{" "}
						is exported completely independent of any UI. A host
						wanting a genuinely different look throws away every
						styled component and builds its own on the same hook.
					</li>
				</ol>
			</section>

			<section className="flex flex-col gap-3">
				<h2 className="font-semibold text-foreground text-xl">
					Where to go next
				</h2>
				<p className="text-muted-foreground text-sm">
					Use the sidebar to browse every component — each page has a
					live, interactive preview alongside the real code and a full
					props reference. Components that reach the real backend
					(ChatPanel, PromptOptimizer, EngineSelect, McpMenuButton)
					use whichever engine you connect at the top of this site.
				</p>
			</section>
		</DocPage>
	);
};
