import { observer } from "mobx-react-lite";
import type React from "react";
import { RendererEngine } from "@semoss/renderer";
import { ErrorBoundary } from "@/components/common";
import { useDesigner } from "@/hooks";
import { Screen } from "./Screen";

interface DesignerPanelProps {
	/** Id of the designer */
	id: string;
}

export const Designer = observer(
	(props: DesignerPanelProps): React.JSX.Element => {
		const { designer } = useDesigner();
		const id = props.id;

		if (!designer) {
			return null;
		}

		return (
			<Screen>
				<ErrorBoundary title={"Something went wrong!"}>
					<RendererEngine id={id} />
				</ErrorBoundary>
			</Screen>
		);
	},
);
