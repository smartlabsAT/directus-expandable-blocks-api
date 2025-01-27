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

