import { observer } from "mobx-react-lite";
import { useInsight } from "@semoss/sdk/react";
import {
	FileExplorer,
	FileExplorerItem,
	type FlexLayout,
} from "@semoss/shared";
import type { RoomStore } from "@/stores";

interface RoomFileExplorerProps {
	/** Layout */
	layout: FlexLayout.Layout | null;

	/** Room */
	room: RoomStore;
}

export const RoomFileExplorer: React.FC<RoomFileExplorerProps> = observer(
	({ layout, room }) => {
		const insight = useInsight();

		const mode = {
			type: "APP",
			app: "059ad2f3-fae4-4c56-8b1e-a1933d540846",
		} as const;

		return (
			<FileExplorer
				mode={mode}
				ItemComponent={({ item, onSelect, ...otherProps }) => {
					return (
						<FileExplorerItem
							item={item}
							onSelect={() => {
								// trigger the default
								onSelect();

								// don't open directories
								if (item.type === "directory") {
									return;
								}

								// this will select if there or open if not
								room.addSidebarNode(`FILE--${item.path}`, {
									type: "tab",
									name: item.name,
									component: "room-file-editor",
									config: {
										name: item.name,
										path: item.path,
									},
									enableClose: true,
								});
							}}
							onDragStart={(e) => {
								// cannot drag directories
								if (item.type === "directory") {
									return;
								}

								// add to layout
								layout.addTabWithDragAndDrop(
									e as unknown as DragEvent,
									{
										type: "tab",
										name: item.name,
										component: "room-file-editor",
										config: {
											name: item.name,
											path: item.path,
										},
										enableClose: true,
									},
								);
							}}
							secondaryActions={[
								{
									name: "Copy Path",
									action: async (item) => {
										try {
											await navigator.clipboard.writeText(
												item.path,
											);
										} catch (_e) {
											throw new Error(
												"Failed to copy to clipboard",
											);
										}
									},
								},
								// item.path.endsWith(".zip")
								// 	? {
								// 			name: "Unzip",
								// 			action: async (item) => {
								// 				const pixel = "";

								// 				await insight.actions.run(
								// 					pixel,
								// 				);
								// 			},
								// 		}
								// 	: null,
								{
									name: "Delete",
									action: async (item) => {
										let pixel = "";

										if (mode.type === "APP") {
											pixel = `DeleteAppAssets(project=["${mode.app}"], filePath=["${item.path}"]);`;
										} else if (mode.type === "ENGINE") {
											// pixel = `DeleteEngineAssets(engine=["${mode.engine}"], filePath=["${item.path}"]);`;
										}

										await insight.actions.run(pixel);
									},
								},
							]}
							{...otherProps}
						/>
					);
				}}
			/>
		);
	},
);
