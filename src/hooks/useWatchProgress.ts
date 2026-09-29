// Stub hook — watch progress tracking was removed when the site was converted
// from a streaming platform to a movie review/community site.
// Returns an always-empty list so components that still reference this hook
// compile and render without errors (they show a "no activity yet" state).

export interface WatchProgressItem {
  id: number;
  title: string;
  media_type: 'movie' | 'tv';
  poster_path: string | null;
  backdrop_path?: string | null;
  progress?: number; // 0-100
  episode?: number;
  season?: number;
  updatedAt?: string;
}

export function useWatchProgress() {
  return {
    progressList: [] as WatchProgressItem[],
    updateProgress: (_item: WatchProgressItem) => {},
    removeProgress: (_id: number) => {},
    clearAll: () => {},
  };
}
