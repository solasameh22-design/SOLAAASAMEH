// Local only: starts the API on http://localhost:3001
import { app } from './app.js';

const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => console.log(`API ready on http://localhost:${port}`));
