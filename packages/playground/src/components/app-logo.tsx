import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { H4 } from "@semoss/ui/next";

const APP_NAME = import.meta.env.VITE_APP_NAME
	? import.meta.env.VITE_APP_NAME
	: "";
const LOGO_PATH = import.meta.env.VITE_LOGO_PATH
	? import.meta.env.VITE_LOGO_PATH
	: "";

export const AppLogo = observer(() => {
	const [logo, setLogo] = useState(null);

	useEffect(() => {
		fetch(LOGO_PATH)
			.then((res) => res.text())
			.then((svg) => {
				setLogo(svg);
			})
			.catch((err) => console.error("Failed to load SVG:", err));
	}, []);

	return (
		<div className="flex h-8 w-full flex-row items-center gap-2">
			{logo ? (
				<div
					style={{ display: "inline-block", color: "inherit" }}
					// biome-ignore lint/security/noDangerouslySetInnerHtml:this intentionally loads in a logo
					dangerouslySetInnerHTML={{ __html: logo }}
				/>
			) : null}
			<H4>{APP_NAME}</H4>
		</div>
	);
});
