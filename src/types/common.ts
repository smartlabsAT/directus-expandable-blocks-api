export interface ApiResponse<T> {
    data: T;
    meta?: Record<string, any>;
}
