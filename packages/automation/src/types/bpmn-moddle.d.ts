declare module "bpmn-moddle" {
	export interface ModdleElement {
		$type: string;
		get(property: string): unknown;
		set(property: string, value: unknown): void;
	}

	interface ParseResult {
		rootElement: ModdleElement;
		warnings: Error[];
	}

	interface SerializationResult {
		xml: string;
	}

	export class BpmnModdle {
		create(
			typeName: string,
			attributes?: Record<string, unknown>,
		): ModdleElement;
		fromXML(xml: string, typeName?: string): Promise<ParseResult>;
		toXML(
			element: ModdleElement,
			options?: { format?: boolean },
		): Promise<SerializationResult>;
	}
}

interface BpmnCanvas {
	viewbox(): { outer: { width: number; height: number } };
	/** Returns current zoom level when called with no arguments. */
	zoom(): number;
	zoom(level: number): number;
	zoom(mode: "fit-viewport", center?: { x: number; y: number }): number;
}

interface BpmnJsInstance {
	get(service: "canvas"): BpmnCanvas;
	get(service: string): unknown;
	on(event: string, handler: () => void): void;
	off(event: string, handler: () => void): void;
	importXML(xml: string): Promise<{ warnings: string[] }>;
	destroy(): void;
}

interface BpmnModelerInstance extends BpmnJsInstance {
	saveXML(options?: { format?: boolean }): Promise<{ xml: string }>;
	saveSVG(): Promise<{ svg: string }>;
}

declare module "bpmn-js/lib/NavigatedViewer" {
	// biome-ignore lint/style/noDefaultExport: third-party library uses default export
	export default class NavigatedViewer implements BpmnJsInstance {
		constructor(options: { container: HTMLElement });
		get(service: "canvas"): BpmnCanvas;
		get(service: string): unknown;
		importXML(xml: string): Promise<{ warnings: string[] }>;
		destroy(): void;
	}
}

declare module "bpmn-js/lib/Modeler" {
	// biome-ignore lint/style/noDefaultExport: third-party library uses default export
	export default class BpmnModeler implements BpmnModelerInstance {
		constructor(options: {
			container: HTMLElement;
			[key: string]: unknown;
		});
		get(service: "canvas"): BpmnCanvas;
		get(service: string): unknown;
		on(event: string, handler: () => void): void;
		off(event: string, handler: () => void): void;
		importXML(xml: string): Promise<{ warnings: string[] }>;
		saveXML(options?: { format?: boolean }): Promise<{ xml: string }>;
		saveSVG(): Promise<{ svg: string }>;
		destroy(): void;
	}
}
