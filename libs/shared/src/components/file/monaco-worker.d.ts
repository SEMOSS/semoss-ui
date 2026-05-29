// Declaration for importing web workers with ?worker
// Allows TypeScript to recognize imports like '...worker?worker'
declare module "*?worker" {
	const worker: new () => Worker;
	export default worker;
}
