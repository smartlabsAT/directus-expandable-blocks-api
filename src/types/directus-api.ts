import { Request, Response } from 'express';

export interface DirectusRequest extends Request {
    accountability?: any;
    schema?: any;
}

export interface DirectusResponse extends Response {}
