export interface ApiResponse<T> {
    data: T;
    meta?: Record<string, any>;
}

export interface UsageLocation {
    id: string | number;
    collection: string;
    title?: string;
    status?: string;
    field: string;
    sort?: number;
    path?: string;
    edit_url?: string;
    junction_id?: number;
    area?: string;
}

export interface UsageSummary {
    total_count: number;
    by_collection: Record<string, number>;
    by_status: Record<string, number>;
    by_field?: Record<string, number>;
}

export interface ItemWithUsage {
    [key: string]: any;
    usage_locations: UsageLocation[];
    usage_summary: UsageSummary;
}
