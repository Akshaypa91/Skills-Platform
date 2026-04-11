import express from 'express';
import multer from 'multer';
import { createCourse, deleteCourse, getCourseById, getCourses, getMyRating, getPublicCourses, rateCourse } from '../controllers/courseController.js';
import { createClerkClient } from '@clerk/backend';

// Use memory storage — file buffer is streamed directly to Cloudinary
const upload = multer({ storage: multer.memoryStorage() });

const courseRouter = express.Router();

courseRouter.get('/public', getPublicCourses);
courseRouter.get('/', getCourses);
courseRouter.get('/:id', getCourseById);

courseRouter.post('/', upload.single('image'), createCourse);
courseRouter.delete('/:id', deleteCourse);

courseRouter.post('/:courseId/rate', rateCourse);
courseRouter.get('/:courseId/rating', getMyRating);

export default courseRouter;
