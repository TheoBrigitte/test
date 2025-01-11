import { merge } from "./merge.js";

// Merge multiple source changelog files into a changelog unreleased changes
export function mergeMultiple(sources, options) {
  sources.forEach((source) => {
    try {
      merge(source, options);
      console.log(`Merged ${source}`);
    } catch (error) {
      console.error(`Failed ${source}: ${error.message}`);
    }
  });
}
