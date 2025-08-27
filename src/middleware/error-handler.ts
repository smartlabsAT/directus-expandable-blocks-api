export const errorHandler = (context: any) => {
    return (err: any, _req: any, res: any, _next: any) => {
        const status = err.status || 500;
        const message = err.message || 'Internal Server Error';
        
        context.logger?.error(err);
        
        res.status(status).json({
            error: { message, status }
        });
    };
};
