export type Level = "Beginner" | "Intermediate" | "Advanced" | "Master";

export type Topic = {
  id: string;
  level: Level;
  title: string;
  summary: string;
  keywords: string[];
  steps: string[];
};

export type Source = {
  title: string;
  url: string;
  category: "Glazy" | "Reference";
};

export type TopicSources = Record<string, string[]>;

export type KnowledgeEntry = {
  id: string;
  level: Level;
  title: string;
  category: string;
  summary: string;
  details: string[];
  keywords: string[];
  sourceLabels: string[];
};
