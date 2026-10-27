import type { ComponentType } from "react";
import type { LucideIcon } from "lucide-react";

export type RoutePath =
  | "dashboard"
  | "chat"
  | "subjects"
  | "syllabus"
  | "roadmap"
  | "lessons"
  | "practice"
  | "projects"
  | "assessment"
  | "results"
  | "result"
  | "challenge"
  | "battles"
  | "leaderboard"
  | "competitions"
  | "rewards"
  | "profile"
  | "verify"
  | "admin";

export type NavCategory = "core" | "practice" | "social" | "records" | "admin";

export interface NavItem {
  readonly path: RoutePath;
  readonly label: string;
  readonly icon: LucideIcon;
  readonly category: NavCategory;
  readonly description?: string;
  readonly requiresAuth?: boolean;
}

export interface RouteConfig {
  readonly path: RoutePath;
  readonly title: string;
  readonly subtitle?: string;
  readonly component?: ComponentType<any>;
}

export interface ParsedRoute {
  readonly path: RoutePath;
  readonly param?: string;
  readonly fullPath: string;
}
