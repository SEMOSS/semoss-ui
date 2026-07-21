import type { EnvironmentConfig } from "../connections/types";
import environmentConfig from "./environment.json";

/**
 * The one SEMOSS environment this build talks to — which instance, and
 * how to reach it, is a build-time decision (this JSON file), not
 * something a user types into a form. There's exactly one entry today;
 * see ROADMAP.md if that ever needs to grow into a list.
 */
export const ENVIRONMENT: EnvironmentConfig = environmentConfig;
