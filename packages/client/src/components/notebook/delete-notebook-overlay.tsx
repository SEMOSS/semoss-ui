import { observer } from "mobx-react-lite";
import { useState } from "react";
import { ActionMessages, useBlocks } from "@semoss/renderer";
import { Button } from "@semoss/ui/next";

interface DeleteNotebookOverlayProps {
	/** id of the deleted notebok */
	deletedNotebookId: string;

	/**
	 * Method called to close overlay
	 * @param success - true if successful
	 */
	onClose: (success: boolean) => void;
}

/**
 * Delete a query
 */
export const DeleteNotebookOverlay = observer(
	(props: DeleteNotebookOverlayProps): JSX.Element => {
		const { deletedNotebookId, onClose = () => null } = props;

		const { state } = useBlocks();

		const [isLoading, setIsLoading] = useState(false);

		/**
		 * Add the file to the app
		 */
		const deleteNotebook = async () => {
			try {
				setIsLoading(true);

				state.dispatch({
					message: ActionMessages.DELETE_NOTEBOOK,
					payload: {
						queryId: deletedNotebookId,
					},
				});

				onClose(true);
			} catch (e) {
				console.error(e);
			} finally {
				setIsLoading(false);
			}
		};

		const name = deletedNotebookId;

		return (
			<>
				<div className="px-6 pt-6 pb-2">
					<h2 className="font-semibold text-lg">Are you sure?</h2>
				</div>
				<div className="px-6 py-2">
					<p className="text-sm">
						This will delete <b>{name}</b>
					</p>
				</div>
				<div className="flex justify-end gap-2 px-6 pt-2 pb-6">
					<Button
						variant="outline"
						onClick={() => {
							onClose(false);
						}}
					>
						Close
					</Button>
					<Button
						disabled={isLoading}
						variant="destructive"
						onClick={() => {
							deleteNotebook();
						}}
					>
						Delete
					</Button>
				</div>
			</>
		);
	},
);
