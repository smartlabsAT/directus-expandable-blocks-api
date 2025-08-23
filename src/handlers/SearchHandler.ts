import { DirectusRequest, DirectusResponse } from '../types/directus-api';

export class SearchHandler {
    constructor(private serviceFactory: any, private logger: any) {}
    
    async handle(req: DirectusRequest, res: DirectusResponse): Promise<void> {
        const { collection } = req.params;
        const { search, limit = 10 } = req.query;
        
        const results = await this.search(collection, search as string, +limit);
        res.json({ data: results });
    }
    
    private async search(collection: string, query: string, limit: number) {
        return [];
    }
}
