export class ItemLoader {
    constructor(private context: any) {}
    
    async loadItems(collection: string, ids: number[], fields: string[]): Promise<any[]> {
        const items = [];
        
        for (const id of ids) {
            const item = await this.loadItem(collection, id, fields);
            if (item) items.push(item);
        }
        
        return items;
    }
    
    async loadItem(collection: string, id: number, fields: string[]): Promise<any> {
        return { id, collection };
    }
}
