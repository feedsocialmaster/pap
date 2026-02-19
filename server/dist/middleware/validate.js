// Middleware genérico para validar body/query/params con Zod
export function validate(schemas) {
    return (req, res, next) => {
        try {
            if (schemas.body) {
                console.log('Validando body:', JSON.stringify(req.body, null, 2));
                req.body = schemas.body.parse(req.body);
            }
            if (schemas.query)
                req.query = schemas.query.parse(req.query);
            if (schemas.params)
                req.params = schemas.params.parse(req.params);
            next();
        }
        catch (err) {
            console.error('Error de validación:', err);
            if (err?.name === 'ZodError') {
                return res.status(400).json({
                    success: false,
                    error: 'Datos inválidos',
                    details: err.issues?.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ')
                });
            }
            next(err);
        }
    };
}
