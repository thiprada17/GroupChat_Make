export function errorHandler(error, _request, response, _next) {
  if (error.type === 'entity.too.large') {
    return response.status(413).json({ error: { message: 'Request body is too large' } });
  }
  if (error instanceof SyntaxError && 'body' in error) {
    return response.status(400).json({ error: { message: 'Invalid JSON body' } });
  }

  console.error(error);
  return response.status(500).json({ error: { message: 'Internal server error' } });
}
