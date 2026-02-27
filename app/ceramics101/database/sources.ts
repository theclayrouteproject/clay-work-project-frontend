import sourcesData from "./sources.data.json";
import type { Source, TopicSources } from "./types";

type SourcesDataShape = {
  sources: Source[];
  topicSources: TopicSources;
};

const typedSourcesData = sourcesData as SourcesDataShape;

export const sources: Source[] = typedSourcesData.sources;
export const topicSources: TopicSources = typedSourcesData.topicSources;
