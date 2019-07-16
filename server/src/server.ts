import * as express from 'express';

const app = express();

const staticPath = `${__dirname}/dist/`;
app.use(express.static(staticPath));
app.listen(80);
