import curriculumData from "./curriculum.data.json";
import type { Level, Topic } from "./types";

export const levels: Level[] = ["Beginner", "Intermediate", "Advanced", "Master"];

export const curriculum: Topic[] = curriculumData as Topic[];
