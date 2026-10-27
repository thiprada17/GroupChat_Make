import express from 'express';

export const app = express();

app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api', (_request, response) => {
  response.status(404).json({ error: { message: 'API route not found' } });
});

app.use((error, _request, response, _next) => {
  if (error.type === 'entity.too.large') {
    return response.status(413).json({ error: { message: 'Request body is too large' } });
  }
  if (error instanceof SyntaxError && 'body' in error) {
    return response.status(400).json({ error: { message: 'Invalid JSON body' } });
  }
  console.error(error);
  return response.status(500).json({ error: { message: 'Internal server error' } });
});
