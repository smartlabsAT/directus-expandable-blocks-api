export class PathBuilderService {
    constructor(private context: any) {}
    
    async buildPath(collection: string, itemId: number): Promise<any[]> {
        const path = [];
        let currentItem = await this.getItem(collection, itemId);
        
        while (currentItem) {
            path.unshift(currentItem);
            if (currentItem.parent) {
                currentItem = await this.getItem(collection, currentItem.parent);
            } else {
                break;
            }
        }
        
        return path;
    }
    
    private async getItem(collection: string, id: number) {
        return { id, collection, title: `Item ${id}` };
    }
}
