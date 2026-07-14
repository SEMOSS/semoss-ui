import { Navigate, Route, Routes } from "react-router-dom";
import { COMPONENT_REGISTRY } from "@/components/components-playground/component-registry";
import { ComponentsPlaygroundLayout } from "@/components/components-playground/components-playground-layout";
import { OverviewDoc } from "@/components/components-playground/docs/overview-doc";

/** /components/playground — a shadcn/ui-style reference site for
 * @semoss/chat, living inside the real, authenticated SEMOSS app. Same
 * "registry maps path -> component, wrapped in a shared layout" shape as
 * settings-router.tsx. */
export const ComponentsPlaygroundRouter = () => {
	return (
		<Routes>
			<Route path="/" element={<ComponentsPlaygroundLayout />}>
				<Route index element={<OverviewDoc />} />
				{COMPONENT_REGISTRY.map((entry) => (
					<Route
						key={entry.slug}
						path={entry.slug}
						element={<entry.Doc />}
					/>
				))}
			</Route>
			<Route path="*" element={<Navigate to="." replace />} />
		</Routes>
	);
};
