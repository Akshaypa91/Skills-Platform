import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { clerkMiddleware } from '@clerk/express';
import { connectDB } from './config/db.js';
import courseRouter from './routes/courseRouter.js';
import bookingRouter from './routes/bookingRouter.js';

const app = express();
const port = process.env.PORT || 4000;

// Middlewares
app.use(cors({
	origin: [
		"http://localhost:5173",
		"http://localhost:5174",

		// Vercel Frontend + Admin (add your real deployed links here)
		"https://skills-platform-raew.vercel.app",
		"https://skills-platform-admin.vercel.app"
	],
	credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(clerkMiddleware());

app.use('/uploads', express.static('uploads'));

// DB
connectDB();

// Routes
app.use('/api/course', courseRouter);
app.use('/api/booking', bookingRouter);

app.get('/', (req, res) => {
	res.send('API working');
});

app.listen(port, () => {
	console.log(`Server Started on port: ${port}`);
});