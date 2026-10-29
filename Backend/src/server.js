import { app } from './app.js';
import { config } from './lib/config.js';

app.listen(config.port, config.host, () => {
  console.log(`Backend listening at http://${config.host}:${config.port}`);
});
