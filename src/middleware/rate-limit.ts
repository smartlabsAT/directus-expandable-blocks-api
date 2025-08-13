const requestCounts = new Map();

export const rateLimitMiddleware = () => {
    return (req: any, res: any, next: any) => {
        const key = req.ip;
        const now = Date.now();
        const windowMs = 60000; // 1 minute
        const limit = 100;
        
        if (!requestCounts.has(key)) {
            requestCounts.set(key, []);
        }
        
        const requests = requestCounts.get(key).filter((t: number) => now - t < windowMs);
        
        if (requests.length >= limit) {
            return res.status(429).json({ error: 'Too many requests' });
        }
        
        requests.push(now);
        requestCounts.set(key, requests);
        next();
    };
};
