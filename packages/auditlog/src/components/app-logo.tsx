import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { H4 } from "@semoss/ui/next";
import { useRootStore } from "@/hooks";

export const AppLogo = observer(() => {
	const [logo, setLogo] = useState(null);

	const { root } = useRootStore();

	useEffect(() => {
		fetch(root.theme.images.logo)
			.then((res) => res.text())
			.then((svg) => {
				setLogo(svg);
			})
			.catch((err) => console.error("Failed to load SVG:", err));
	}, [root.theme.images.logo]);

	return (
		<div className="flex h-8 w-full flex-row items-center gap-2">
			{logo ? (
				<div
					style={{ display: "inline-block", color: "inherit" }}
					// biome-ignore lint/security/noDangerouslySetInnerHtml:this intentionally loads in a logo
					dangerouslySetInnerHTML={{ __html: logo }}
				/>
			) : null}
			<H4>{root.theme.name}</H4>
		</div>
	);
});
