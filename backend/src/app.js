import express from 'express';
import cors from 'cors';

import healthRouter from './routes/health.js';
import menuRouter from './routes/menu.js';
import ordersRouter from './routes/orders.js';
import authRouter from './routes/auth.js';
import adminRouter from './routes/admin.js';
import terminalRouter from './routes/terminal.js';
import reportsRouter from './routes/reports.js';
import tablesRouter from './routes/tables.js';
import settingsRouter from './routes/settings.js';
import staffRouter from './routes/staff.js';
import couponsRouter from './routes/coupons.js';
import inventoryRouter from './routes/inventory.js';
import customersRouter from './routes/customers.js';
import dailyCostsRouter from './routes/dailyCosts.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/health', healthRouter);
app.use('/api/menu', menuRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/terminal', terminalRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/tables', tablesRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/staff', staffRouter);
app.use('/api/coupons', couponsRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/customers', customersRouter);
app.use('/api/daily-costs', dailyCostsRouter);

app.use(notFound);
app.use(errorHandler);

export default app;
