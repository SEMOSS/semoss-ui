import { makeAutoObservable, runInAction } from "mobx";
import { promptAssistService } from "../../services/PromptAssistService";
import type {
	OptimizationResult,
	PromptAssistConfig,
	PromptIssue,
} from "./types";

export class PromptAssistStore {
	// State
	issues: PromptIssue[] = [];
	isAnalyzing = false;
	isOptimizing = false;
	qualityScore = 0;
	tokenCount = 0;

	// History for undo/redo
	promptHistory: string[] = [];
	historyIndex = -1;

	// Configuration
	config: PromptAssistConfig = {
		enabled: true,
		autoAnalyze: true,
		debounceMs: 300,
		apiEndpoint: "http://localhost:8000",
		showQualityScore: true,
		useLLM: false,
	};

	constructor() {
		makeAutoObservable(this);
	}

	// Actions
	setEnabled(enabled: boolean) {
		this.config.enabled = enabled;
	}

	toggleAutoAnalyze() {
		this.config.autoAnalyze = !this.config.autoAnalyze;
	}

	toggleLLM() {
		this.config.useLLM = !this.config.useLLM;
	}

	setConfig(config: Partial<PromptAssistConfig>) {
		this.config = { ...this.config, ...config };
	}

	async analyzePrompt(text: string): Promise<void> {
		if (!this.config.enabled || text.length < 10) {
			this.clearIssues();
			return;
		}

		this.isAnalyzing = true;

		try {
			const result = await promptAssistService.analyzePrompt(
				text,
				this.config.useLLM,
			);
			console.log("TESTING result:", result);
			runInAction(() => {
				this.issues = result.issues;
				this.qualityScore = result.quality_score;
				this.tokenCount = result.token_count;
				this.isAnalyzing = false;
			});
		} catch (error) {
			runInAction(() => {
				this.isAnalyzing = false;
				console.error("[PromptAssist] Analysis failed:", error);
			});
		}
	}

	async optimizePrompt(text: string): Promise<OptimizationResult | null> {
		this.isOptimizing = true;

		try {
			const result = await promptAssistService.optimizePrompt(text);

			runInAction(() => {
				this.isOptimizing = false;
			});

			return result;
		} catch (error) {
			runInAction(() => {
				this.isOptimizing = false;
			});
			console.error("[PromptAssist] Optimization failed:", error);
			return null;
		}
	}

	clearIssues() {
		this.issues = [];
		this.qualityScore = 0;
		this.tokenCount = 0;
	}

	// History management
	addToHistory(prompt: string) {
		// Remove any future history if we're not at the end
		this.promptHistory = this.promptHistory.slice(0, this.historyIndex + 1);
		this.promptHistory.push(prompt);
		this.historyIndex = this.promptHistory.length - 1;

		// Limit history to 50 entries
		if (this.promptHistory.length > 50) {
			this.promptHistory.shift();
			this.historyIndex--;
		}
	}

	undo(): string | null {
		if (this.historyIndex > 0) {
			this.historyIndex--;
			return this.promptHistory[this.historyIndex];
		}
		return null;
	}

	redo(): string | null {
		if (this.historyIndex < this.promptHistory.length - 1) {
			this.historyIndex++;
			return this.promptHistory[this.historyIndex];
		}
		return null;
	}

	// Getters
	get canUndo(): boolean {
		return this.historyIndex > 0;
	}

	get canRedo(): boolean {
		return this.historyIndex < this.promptHistory.length - 1;
	}

	getIssueAtPosition(position: number): PromptIssue | undefined {
		return this.issues.find(
			(issue) => position >= issue.start && position <= issue.end,
		);
	}

	getIssuesBySeverity(severity: "critical" | "medium" | "low") {
		return this.issues.filter((issue) => issue.severity === severity);
	}

	get criticalIssueCount(): number {
		return this.getIssuesBySeverity("critical").length;
	}

	get mediumIssueCount(): number {
		return this.getIssuesBySeverity("medium").length;
	}

	get lowIssueCount(): number {
		return this.getIssuesBySeverity("low").length;
	}

	get qualityLevel(): "excellent" | "good" | "needs_improvement" | "poor" {
		if (this.qualityScore >= 90) return "excellent";
		if (this.qualityScore >= 70) return "good";
		if (this.qualityScore >= 50) return "needs_improvement";
		return "poor";
	}
}
