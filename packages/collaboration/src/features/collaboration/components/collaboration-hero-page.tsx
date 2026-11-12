import type { ReactNode } from "react";
import heroPhoto from "@/assets/img/today-hero.jpg";

/**
 * A page that opens on the desk photo. It has no scroller of its own: the shell
 * scrolls these pages with its header, and on desktop the page starts behind
 * that header. Its route must also be listed in `isHeroPath`.
 */
export function CollaborationHeroPage({ children }: { children: ReactNode }) {
	return (
		<div className="lg:-mt-14 relative isolate min-w-0 px-4 pb-8 sm:px-6 lg:px-8 lg:pt-14">
			{/* decorative; hidden where it would crowd the heading or glare on a dark page */}
			<img
				src={heroPhoto}
				alt=""
				className="-z-10 mask-b-from-60% mask-l-from-50% pointer-events-none absolute top-0 right-0 hidden h-auto w-3/5 max-w-4xl select-none xl:not-dark:block"
			/>
			<div className="@container mx-auto w-full max-w-screen-2xl">
				{children}
			</div>
		</div>
	);
}
