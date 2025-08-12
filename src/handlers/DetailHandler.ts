import { DirectusRequest, DirectusResponse } from '../types/directus-api';

export class DetailHandler {
    constructor(private serviceFactory: any, private logger: any) {}
    
    async handle(req: DirectusRequest, res: DirectusResponse): Promise<void> {
        const { collection } = req.params;
        const { ids, fields } = req.body;
        
        if (!ids || !Array.isArray(ids)) {
            return res.status(400).json({ error: 'Invalid ids parameter' });
        }
        
        const items = await this.loadItems(collection, ids, fields);
        res.json({ data: items });
    }
    
    private async loadItems(collection: string, ids: number[], fields: string) {
        return ids.map(id => ({ id, collection }));
    }
}
