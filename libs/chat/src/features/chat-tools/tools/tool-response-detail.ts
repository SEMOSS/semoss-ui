/**
 * Where the room's tool loop appends the details of a failed or stopped call
 * to the guidance it gives the model.
 */
const DETAIL_MARKERS = ["\n\nError Details: ", "\n\nCancellation Details: "];

/**
 * A saved tool response without the model guidance the room's tool loop
 * wraps around a failed or stopped call, for showing to the user.
 *
 * @param response - The saved response.
 * @return The details, or the response as it is when nothing wraps it.
 */
export const readToolResponseDetail = (response: string): string => {
	for (const marker of DETAIL_MARKERS) {
		const index = response.indexOf(marker);
		if (index !== -1) {
			return response.slice(index + marker.length);
		}
	}
	return response;
};
