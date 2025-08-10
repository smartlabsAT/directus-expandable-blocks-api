export class ServiceFactory {
    private services: Map<string, any> = new Map();
    
    constructor(private context: any) {}
    
    getService(name: string): any {
        if (!this.services.has(name)) {
            this.services.set(name, this.createService(name));
        }
        return this.services.get(name);
    }
    
    private createService(name: string): any {
        // Service creation logic
        return {};
    }
}
