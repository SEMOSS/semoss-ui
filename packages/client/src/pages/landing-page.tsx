import { ArrowRight, ArrowUpRight } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { Link } from "react-router-dom";
import type { Variable } from "@semoss/renderer";
import { STATE_VERSION } from "@semoss/renderer/version";
import { Button, H3, H4, Muted, P } from "@semoss/ui/next";
import AgentStarter from "@/assets/img/landing/agent-starter.png";
import BusinessIntelligencePreview from "@/assets/img/landing/bi-preview.png";
import BrowserAutomationPreview from "@/assets/img/landing/browser-automation-preview.png";
import CodeStarter from "@/assets/img/landing/code-starter.png";
import GridMark from "@/assets/img/landing/grid-mark.svg";
import NotebookStarter from "@/assets/img/landing/notebook-starter.png";
import OrbitMark from "@/assets/img/landing/orbit-mark.svg";
import PlaygroundHero from "@/assets/img/landing/playground-hero.png";
import PlaygroundPreview from "@/assets/img/landing/playground-preview.png";
import TemplatesPreview from "@/assets/img/landing/templates-preview.png";
import TerminalPreview from "@/assets/img/landing/terminal-preview.png";
import { NewAppModal } from "@/components/app";
import { LandingFooter } from "@/components/landing";
import { usePage } from "@/hooks";
import { useNavigate } from "@/hooks/useNavigate";
import {
	BASE_APP_QUERIES,
	BASE_APP_VARIABLES,
	BASE_PAGE_BLOCKS,
} from "@/pages/app/app.constants";
import { NavbarHeader, NavbarLeft } from "../components/shared";

const SYSTEM_APPS = [
	{
		name: "Playground",
		description: "Test your apps and skills.",
		href: "../../playground/dist/",
		image: PlaygroundPreview,
	},
	{
		name: "Terminal",
		description: "Execute commands and see a response",
		href: "../../terminal/dist/",
		image: TerminalPreview,
	},
	{
		name: "Business Intelligence",
		description: "Develop dashboards and visualizations to view data",
		href: "../../legacy/dist/",
		image: BusinessIntelligencePreview,
	},
	{
		name: "Browser Automation",
		description:
			"Drive a remote browser, record what you do, and replay it later",
		href: "../../browser-automation/dist/",
		image: BrowserAutomationPreview,
	},
] as const;

const STARTER_CARDS = [
	{
		title: "Develop in code",
		description:
			"Choose a framework or start from scratch - code and preview your app seamlessly in our editor!",
		image: CodeStarter,
		type: "code",
		testId: "new-app-code-btn",
	},
	{
		title: "Construct an agent",
		description:
			"Engineer a prompt to interact with your LLM. Structure the text and design inputs to generate the optimal AI response.",
		image: AgentStarter,
		href: "/app/new/prompt",
		type: "agent",
		testId: "new-app-agent-btn",
	},
	{
		title: "Run interactive notebooks",
		description:
			"Write and execute code cells, visualize data, and document your analysis in a live, interactive notebook environment.",
		image: NotebookStarter,
		href: "/notebook",
		type: "notebook",
		testId: "new-notebook-btn",
	},
] as const;

export const LandingPage: React.FC = observer(() => {
	usePage({
		showNavbarSearch: true,
	});

	const navigate = useNavigate();

	const [newAppOptions, setNewAppOptions] = useState<
		React.ComponentProps<typeof NewAppModal>["options"] | null
	>(null);

	const isNameOpen = !!newAppOptions;
	const handleCreate = (type: "blocks" | "code" | "agent" | "notebook") => {
		if (type === "blocks") {
			setNewAppOptions({
				type: "blocks",
				state: {
					version: STATE_VERSION,
					variables: BASE_APP_VARIABLES as Record<string, Variable>,
					queries: BASE_APP_QUERIES,
					blocks: BASE_PAGE_BLOCKS,
					executionOrder: [],
				},
			});
		} else if (type === "code") {
			setNewAppOptions({ type: "code" });
		} else if (type === "agent") {
			navigate("/app/new/prompt");
		} else {
			navigate("/notebook");
		}
	};

	return (
		<>
			<NavbarLeft>
				<NavbarHeader variant="landing" />
			</NavbarLeft>
			<div className="mx-auto flex w-full max-w-300 flex-col gap-16 px-4 pt-8 pb-16 sm:px-6 md:gap-24 md:px-10 md:pt-16">
				<section className="grid items-center gap-10 lg:grid-cols-2 lg:gap-10">
					<div className="flex max-w-xl flex-col items-start gap-6">
						<Muted className="font-mono font-normal text-xs uppercase tracking-widest">
							Intelligent AI
						</Muted>
						<H3 className="font-medium text-3xl leading-tight sm:text-4xl md:text-5xl">
							Build apps that put AI to work
						</H3>
						<P className="text-base text-muted-foreground leading-normal md:text-lg">
							Create AI-powered applications with the tools,
							templates, and workflows your team needs. Start with
							a proven foundation, customize it for your use case,
							and ship it on your infrastructure.
						</P>
						<Button asChild size="lg" className="rounded-full px-6">
							<Link to="/app/new">Start Building</Link>
						</Button>
					</div>
					<img
						src={PlaygroundHero}
						alt=""
						aria-hidden="true"
						className="w-full"
					/>
				</section>

				<section className="flex flex-col gap-6">
					<div className="flex max-w-2xl flex-col gap-2">
						<H3 className="font-medium text-3xl leading-tight sm:text-4xl">
							Get started with our tools
						</H3>
						<P className="text-base text-muted-foreground md:text-lg">
							Start building your app in the way that works best
							for you.
						</P>
					</div>
					<div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
						{STARTER_CARDS.map((card) => {
							const content = (
								<>
									<img
										src={card.image}
										alt=""
										aria-hidden="true"
										className="w-full rounded-xl transition-opacity group-hover:opacity-90"
									/>
									<div className="flex flex-col items-start gap-2">
										<H4 className="font-medium text-xl">
											{card.title}
										</H4>
										<P className="text-muted-foreground">
											{card.description}
										</P>
									</div>
								</>
							);

							return card.type === "code" ? (
								<button
									key={card.title}
									type="button"
									onClick={() => handleCreate(card.type)}
									className="group flex min-w-0 flex-col gap-6 rounded-xl text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
									data-testid={card.testId}
								>
									{content}
								</button>
							) : (
								<Link
									key={card.title}
									to={card.href}
									className="group flex min-w-0 flex-col gap-6 rounded-xl text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
									data-testid={card.testId}
								>
									{content}
								</Link>
							);
						})}
					</div>
				</section>

				<section className="flex flex-col gap-6">
					<div className="flex flex-col gap-2">
						<H3 className="font-medium text-3xl leading-tight sm:text-4xl">
							Try these fan favorites
						</H3>
						<P className="text-base text-muted-foreground md:text-lg">
							Explore popular apps built by the community.
						</P>
					</div>
					<div className="grid gap-x-10 gap-y-10 border-border border-t pt-10 lg:grid-cols-2">
						{SYSTEM_APPS.map((app, index) => (
							<div
								key={app.name}
								className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-5 sm:grid-cols-[auto_minmax(0,1fr)_minmax(10rem,1fr)]"
							>
								<span className="pt-1 font-mono text-primary text-xs tracking-widest">
									{String(index + 1).padStart(2, "0")}
								</span>
								<div className="flex min-w-0 flex-col items-start gap-3 sm:min-h-32">
									<H4 className="font-medium text-xl">
										{app.name}
									</H4>
									<P className="text-muted-foreground">
										{app.description}
									</P>
									<Button
										asChild
										size="sm"
										variant="outline"
										className="mt-auto rounded-full"
									>
										<a href={app.href}>
											Explore
											<ArrowUpRight
												className="size-4"
												aria-hidden="true"
											/>
										</a>
									</Button>
								</div>
								<div className="col-span-2 sm:col-span-1">
									<img
										src={app.image}
										alt=""
										aria-hidden="true"
										className="w-full"
									/>
								</div>
							</div>
						))}
					</div>
				</section>

				<section className="grid items-center gap-10 lg:grid-cols-2 lg:gap-10">
					<div className="flex max-w-xl flex-col items-start gap-4">
						<Muted className="font-mono font-normal text-xs uppercase tracking-widest">
							Customization
						</Muted>
						<H3 className="font-medium text-3xl leading-tight sm:text-4xl md:text-5xl">
							Browse our template catalog
						</H3>
						<P className="text-base text-muted-foreground md:text-lg">
							Explore reusable templates for apps of every kind.
							Choose a starting point, create your own app, and
							customize it to fit your use case.
						</P>
						<Button
							asChild
							variant="outline"
							className="rounded-full"
						>
							<Link to="/app/new">Browse catalog</Link>
						</Button>
					</div>
					<img
						src={TemplatesPreview}
						alt=""
						aria-hidden="true"
						className="w-full"
					/>
				</section>

				<section className="relative overflow-hidden rounded-xl bg-muted px-6 py-16 text-center sm:px-12 md:py-24">
					<img
						src={GridMark}
						alt=""
						aria-hidden="true"
						className="-left-12 absolute top-1/4 size-32 sm:size-48"
					/>
					<img
						src={OrbitMark}
						alt=""
						aria-hidden="true"
						className="-right-8 absolute bottom-8 size-32 sm:right-8 sm:size-48"
					/>
					<div className="relative mx-auto flex max-w-3xl flex-col items-center gap-6">
						<H3 className="font-medium text-3xl leading-tight sm:text-4xl md:text-5xl">
							Turn conversations into actions.{" "}
							<em>Ideas into results.</em>
						</H3>
						<P className="max-w-xl text-base text-muted-foreground md:text-lg">
							Get started in minutes. Easily deploy production
							ready applications.
						</P>
						<Button asChild size="lg" className="rounded-full px-7">
							<Link to="/app/new">
								Start building
								<ArrowRight
									className="size-4"
									aria-hidden="true"
								/>
							</Link>
						</Button>
					</div>
				</section>

				<LandingFooter />
			</div>

			{isNameOpen ? (
				<NewAppModal
					open={isNameOpen}
					options={newAppOptions}
					onClose={(appId) => {
						if (appId) {
							navigate(`/app/${appId}/edit`);
						} else {
							setNewAppOptions(null);
						}
					}}
				/>
			) : null}
		</>
	);
});
