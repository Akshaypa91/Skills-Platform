import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { clerkMiddleware } from '@clerk/express'
import { connectDB } from './config/db.js';
import courseRouter from './routes/courseRouter.js';
import bookingRouter from './routes/bookingRouter.js';

const app = express();
const port = 4000;


//MiddleWares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(clerkMiddleware());

app.use('/uploads', express.static('uploads'));

// DB
connectDB();

//Routes
app.use('/api/course', courseRouter);
app.use('/api/booking', bookingRouter);


//App Post and Listen
app.get('/', (req, res) => {
    res.send('API working');
});

app.listen(port, () => {
    console.log(`Server Started on http://localhost:${port}`);
});