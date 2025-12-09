import { observer } from "mobx-react-lite";
import type React from "react";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbList,
	BreadcrumbPage,
	Separator,
	SidebarTrigger,
} from "@semoss/ui/next";
import { useRoot } from "@/hooks";

export const Header: React.FC = observer(() => {
	const { root } = useRoot();

	if (!root.theme.header) {
		return null;
	}

	return (
		<header className="flex h-full w-full flex-col overflow-hidden rounded-lg border border-border bg-secondary-background shadow-sm transition-all duration-200 ease-in-out">
			<div className="flex h-12.5 w-full flex-row items-center px-4">
				<div className="flex flex-row items-center justify-center gap-1.5">
					<SidebarTrigger />
					<Separator
						orientation="vertical"
						style={{ height: "17px" }}
					/>
					<Breadcrumb>
						<BreadcrumbList>
							<BreadcrumbItem>
								<BreadcrumbPage
									title={""}
									className="max-w-100 truncate text-foreground"
								>
									{""}
								</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
				</div>
				<div className="flex-1" />
			</div>
			<Separator />

			<SidebarTrigger />
			<div
				className="font-semibold text-lg"
				// biome-ignore lint/security/noDangerouslySetInnerHtml: read from theme db we control
				dangerouslySetInnerHTML={{
					__html: root.theme.header,
				}}
			/>
		</header>
	);
});
