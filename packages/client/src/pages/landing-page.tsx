import { ArrowRight } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@semoss/ui/next";
import DevBanner from "@/assets/img/DevBanner.png";
import DevBannerDark from "@/assets/img/DevBanner-dark.png";
import GridMark from "@/assets/img/GridMark.svg";
import OrbitMark from "@/assets/img/OrbitMark.svg";
import {
	AppShowcase,
	LandingFooter,
	PreviewFrame,
	SectionHeading,
	TemplateCatalog,
	ToolCards,
} from "@/components/landing";
import { NavbarHeader, NavbarLeft } from "@/components/shared";
import { usePage } from "@/hooks";

export const LandingPage: React.FC = () => {
	// setup the page
	usePage({
		showNavbarSearch: true,
	});

	return (
		<>
			<NavbarLeft>
				<NavbarHeader />
			</NavbarLeft>

			<div className="mx-auto flex w-full max-w-7xl flex-col gap-16 pb-16 md:gap-24">
				{/* Hero */}
				<section className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
					<div className="flex flex-col items-start gap-6">
						<SectionHeading
							as="h1"
							eyebrow="Build with AI"
							title="Build your next app with AI"
							description="Start from a ready-made template or a blank project, then shape it in code or an interactive notebook. Pick a starting point from the catalog, customize it to fit your use case, and share it with your team when it's ready."
						/>
						<Button asChild size="lg" className="rounded-full">
							<Link to="templates">Start Building</Link>
						</Button>
					</div>
					<PreviewFrame
						src={DevBanner}
						darkSrc={DevBannerDark}
						alt="Building an app in the workspace"
						className="aspect-4/3 w-full"
					/>
				</section>

				{/* Get started with our tools */}
				<section className="flex flex-col gap-6">
					<SectionHeading
						title="Get started with our tools"
						description="Start building your app in the way that works best for you."
					/>
					<ToolCards />
				</section>

				{/* Try these fan favorites */}
				<section className="flex flex-col gap-6">
					<SectionHeading
						title="Try these fan favorites"
						description="Explore popular apps built by the community."
					/>
					<AppShowcase />
				</section>

				{/* Browse our template catalog */}
				<section>
					<TemplateCatalog />
				</section>

				{/* Closing call to action */}
				<section className="relative overflow-hidden rounded-3xl bg-primary/5 px-6 py-16 text-center">
					<img
						src={GridMark}
						alt=""
						aria-hidden="true"
						className="-left-10 pointer-events-none absolute top-1/3 hidden size-48 sm:block"
					/>
					<img
						src={OrbitMark}
						alt=""
						aria-hidden="true"
						className="-right-10 pointer-events-none absolute bottom-0 hidden size-52 sm:block"
					/>
					<div className="relative mx-auto flex max-w-2xl flex-col items-center gap-6">
						<h2 className="heading-xl text-foreground">
							Turn conversations into actions.{" "}
							<em>Ideas into results.</em>
						</h2>
						<p className="text-base text-muted-foreground">
							Get started in minutes. Easily deploy production
							ready applications.
						</p>
						<Button asChild size="lg" className="rounded-full">
							<Link to="templates">
								Start building
								<ArrowRight aria-hidden="true" />
							</Link>
						</Button>
					</div>
				</section>

				<LandingFooter />
			</div>
		</>
	);
};
