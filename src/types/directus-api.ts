import { Request, Response } from 'express';
import { Knex } from 'knex';

// Directus Core Types
export interface Accountability {
    user?: string;
    role?: string;
    admin?: boolean;
    app?: boolean;
    permissions?: any[];
    [key: string]: any;
}

export interface Schema {
    collections: Record<string, any>;
    relations: any[];
    [key: string]: any;
}

export interface DirectusContext {
    services: {
        ItemsService: new (collection: string, options: {
            accountability: Accountability | null;
            schema: Schema;
            knex: Knex;
        }) => ItemsService;
        [key: string]: any;
    };
    database: Knex;
    logger: Logger;
    schema: Schema;
    [key: string]: any;
}

export interface Logger {
    info(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    error(message: string, ...args: any[]): void;
    debug(message: string, ...args: any[]): void;
}

export interface ItemsService {
    readOne(id: string | number, query?: any): Promise<any>;
    readMany(ids?: (string | number)[], query?: any): Promise<any[]>;
    readByQuery(query?: any): Promise<any[]>;
    create(data: any, opts?: any): Promise<any>;
    updateOne(id: string | number, data: any, opts?: any): Promise<any>;
    updateMany(ids: (string | number)[], data: any, opts?: any): Promise<any>;
    deleteOne(id: string | number): Promise<void>;
    deleteMany(ids: (string | number)[]): Promise<void>;
}

export interface DirectusRequest extends Request {
    accountability?: Accountability;
    schema?: Schema;
}

export interface DirectusResponse extends Response {}

// Database Row Types based on actual schema
export interface PagesM2ARow {
    id: number;
    pages_id: number;
    item: string;
    collection: string;
    sort?: number;
}

export interface ExpandableExpandableRow {
    id: number;
    expandable_id: number;
    item: string;
    collection: string;
    sort?: number;
    area: string;
}

export interface ContentHeadlineRow {
    id: number;
    status: string;
    sort?: number;
    user_created?: string;
    date_created?: string;
    user_updated?: string;
    date_updated?: string;
    headline?: string;
    subheadline?: string;
    align?: string;
    divider?: boolean;
}

export interface ExpandableRow {
    id: number;
    status: string;
    sort?: number;
    date_created?: string;
    user_updated?: string;
    date_updated?: string;
    area: string;
}
