// shared semantic data colors, so a topic keeps one color everywhere
const TONES = [
	"bg-chart-1",
	"bg-chart-2",
	"bg-chart-3",
	"bg-chart-4",
	"bg-chart-5",
];

/** The background class a topic's marker is drawn with in navigation, chips, and choices. */
export function topicTone(topicId: string): string {
	const index =
		[...topicId].reduce(
			(value, letter) => value + letter.charCodeAt(0),
			0,
		) % TONES.length;
	return TONES[index] ?? "bg-chart-1";
}
