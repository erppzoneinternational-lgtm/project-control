// Typed key factory system to prevent string key collisions
export const CACHE_KEYS = {
  projectList: (params: any = '') =>
    `projects:list:${typeof params === 'string' ? params : JSON.stringify(params || {})}`,
  project: (id: string) => `projects:detail:${id}`,
  projectManagers: () => `ref:managers`,
  managers: () => `ref:managers`,
  clients: () => `ref:clients`,
  governorates: () => `ref:governorates`,
  cities: (govId?: string) => `ref:cities:${govId ?? 'all'}`,
  nextProjectCode: () => `ref:nextProjectCode`,
  tabData: (projectId: string, tab: string) => `tabs:${tab}:${projectId}`,
  team: (id: string) => `tabs:team:${id}`,
  clientContacts: (projectId: string) => `tabs:clientContacts:${projectId}`,
  siteResources: (projectId: string) => `tabs:siteResources:${projectId}`,
  subcontractors: (projectId: string) => `tabs:subcontractors:${projectId}`,
  wbs: (id: string) => `tabs:wbs:${id}`,
  milestones: (id: string) => `tabs:milestones:${id}`,
  documents: (id: string) => `tabs:documents:${id}`,
  changeOrders: (id: string) => `tabs:changeOrders:${id}`,
  invoices: (id: string) => `tabs:invoices:${id}`,
  archiveLogs: (id: string) => `tabs:archiveLogs:${id}`,

  // Planning Module Nested Key Groups
  boq: {
    list: (projectId: string, onlyCurrent = true) => `boq:items:${projectId}:${onlyCurrent}`,
    item: (id: string) => `boq:detail:${id}`,
    subMaterials: (boqItemId: string) => `boq:subMaterials:${boqItemId}`,
    costCodes: (category?: string) => `ref:costCodes:${category || 'all'}`,
    revisions: (boqItemId: string) => `boq:revisions:${boqItemId}`,
  },
  planning: {
    activities: (projectId: string) => `activities:${projectId}`,
    activity: (id: string) => `activities:detail:${id}`,
    activityProgress: (projectId: string) => `activities:progress:${projectId}`,
    scheduleVersions: (projectId: string) => `schedules:${projectId}`,
    library: (discipline?: string) => `ref:activityLibrary:${discipline || 'all'}`,
    kpis: (projectId: string) => `planningKpis:${projectId}`,
  },
  dailyProgress: {
    list: (projectId: string, filterStr = '') => `dailyReports:${projectId}:${filterStr}`,
    detail: (id: string) => `dailyReport:detail:${id}`,
    photos: (reportId: string) => `dailyReport:photos:${reportId}`,
  },
  allocation: {
    list: (lineIdOrReportId: string) => `allocations:${lineIdOrReportId}`,
    scurve: (projectId: string, granularity = 'week') => `scurve:${projectId}:${granularity}`,
  },
  siteTasks: {
    assignee: (projectId: string, stakeholderId: string) =>
      `siteTasks:assignee:${projectId}:${stakeholderId}`,
    qc: (projectId: string, stakeholderId: string) =>
      `siteTasks:qc:${projectId}:${stakeholderId}`,
    zones: (projectId: string) => `siteTasks:zones:${projectId}`,
  },
  deliverables: {
    list: (projectId: string, status = 'all') => `deliverables:${projectId}:${status}`,
    detail: (id: string) => `deliverables:detail:${id}`,
    rfis: (projectId: string) => `deliverables:rfis:${projectId}`,
    obstructions: (projectId: string) => `deliverables:obstructions:${projectId}`,
  },
  weeklyReport: {
    list: (projectId: string) => `weeklyReports:${projectId}`,
    detail: (id: string) => `weeklyReports:detail:${id}`,
    commercialSettings: (projectId: string) => `commercialSettings:${projectId}`,
  },

  // Flat helper aliases
  costCodes: (category?: string) => `ref:costCodes:${category || 'all'}`,
  activityLibrary: (discipline?: string) => `ref:activityLibrary:${discipline || 'all'}`,
  boqList: (projectId: string, onlyCurrent = true) => `boq:items:${projectId}:${onlyCurrent}`,
  boqItem: (id: string) => `boq:detail:${id}`,
  boqSubMaterials: (boqItemId: string) => `boq:subMaterials:${boqItemId}`,
  activities: (projectId: string) => `activities:${projectId}`,
  activityProgress: (projectId: string) => `activities:progress:${projectId}`,
  scheduleVersions: (projectId: string) => `schedules:${projectId}`,
  dailyReports: (projectId: string, filterStr = '') => `dailyReports:${projectId}:${filterStr}`,
  dailyReportDetail: (id: string) => `dailyReport:detail:${id}`,
  allocations: (reportId: string) => `allocations:${reportId}`,
  scurve: (projectId: string, granularity = 'week') => `scurve:${projectId}:${granularity}`,
  planningKpis: (projectId: string) => `planningKpis:${projectId}`,
  deliverableList: (projectId: string, status = 'all') => `deliverables:${projectId}:${status}`,
  deliverableDetail: (id: string) => `deliverables:detail:${id}`,
  weeklyReports: (projectId: string) => `weeklyReports:${projectId}`,
  commercialSettings: (projectId: string) => `commercialSettings:${projectId}`,
} as const;

export const TTL = {
  projectList: 60_000,    // 60s
  projectDetail: 30_000,   // 30s
  reference: 1_800_000,   // 30min (clients, govs, cities, managers)
  tabData: 30_000,        // 30s
  boq: 60_000,            // 60s
  planning: 30_000,       // 30s
  dailyProgress: 15_000,  // 15s
  siteTasks: 15_000,      // 15s
  allocation: 15_000,     // 15s
  deliverables: 30_000,   // 30s
  weeklyReport: 60_000,   // 60s
} as const;

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export class AppCache {
  public store = new Map<string, CacheEntry<any>>();
  public inflight = new Map<string, Promise<any>>();
  public stats = { hits: 0, misses: 0 };
  private generations = new Map<string, number>();

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) {
      return null;
    }
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlMs: number): void {
    this.store.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
    });
  }

  invalidate(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
        this.generations.set(key, (this.generations.get(key) ?? 0) + 1);
      }
    }
    for (const key of this.inflight.keys()) {
      if (key.startsWith(prefix)) {
        this.inflight.delete(key);
        this.generations.set(key, (this.generations.get(key) ?? 0) + 1);
      }
    }
  }

  clear(): void {
    this.store.clear();
    this.inflight.clear();
    this.generations.clear();
    this.stats = { hits: 0, misses: 0 };
  }

  getStats(): { hits: number; misses: number; hitRate: string } {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total === 0 ? '0%' : `${((this.stats.hits / total) * 100).toFixed(1)}%`;
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate,
    };
  }

  /**
   * Single-flight fetcher: if key is in cache, return cached data.
   * If request for key is currently in-flight, return the shared Promise.
   * Supports both (key, fetcher, ttlMs) and (key, ttlMs, fetcher) overloads.
   */
  async getOrFetch<T>(key: string, fetcher: () => Promise<T>, ttlMs?: number): Promise<T>;
  async getOrFetch<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T>;
  async getOrFetch<T>(
    key: string,
    arg2: (() => Promise<T>) | number,
    arg3?: (() => Promise<T>) | number
  ): Promise<T> {
    let fetcher: () => Promise<T>;
    let ttlMs: number;

    if (typeof arg2 === 'function') {
      fetcher = arg2;
      ttlMs = typeof arg3 === 'number' ? arg3 : 30_000;
    } else {
      ttlMs = arg2;
      fetcher = arg3 as () => Promise<T>;
    }

    const cached = this.get<T>(key);
    if (cached !== null) {
      this.stats.hits++;
      return cached;
    }

    this.stats.misses++;

    if (this.inflight.has(key)) {
      return this.inflight.get(key) as Promise<T>;
    }

    const gen = this.generations.get(key) ?? 0;

    const promise = fetcher()
      .then((data) => {
        if ((this.generations.get(key) ?? 0) === gen) {
          this.set(key, data, ttlMs);
        }
        return data;
      })
      .finally(() => {
        if (this.inflight.get(key) === promise) {
          this.inflight.delete(key);
        }
      });

    this.inflight.set(key, promise);
    return promise;
  }
}

export const appCache = new AppCache();

export const invalidateBoqItemCaches = (projectId?: string, boqItemId?: string): void => {
  if (boqItemId) {
    appCache.invalidate(CACHE_KEYS.boq.item(boqItemId));
    appCache.invalidate(CACHE_KEYS.boq.revisions(boqItemId));
  }
  if (projectId) {
    appCache.invalidate(CACHE_KEYS.boq.list(projectId, true));
    appCache.invalidate(CACHE_KEYS.boq.list(projectId, false));
  }
};
