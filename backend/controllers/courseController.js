import Course from "../models/courseModel.js";
import { getAuth } from "@clerk/express";
import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

// Helper Function
const toNumber = (v, fallback = 0) => {
    if (typeof v === 'number') return v;
    if (typeof v === 'string' && v.trim() === "") return fallback;
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
};

const parseJSONSafe = (maybe) => {
    if (!maybe) return null;
    if (typeof maybe === 'object') return maybe;
    try {
        return JSON.parse(maybe);
    }
    catch {
        return null;
    }
}

// compute fields for totalleacture, course, duration
// mutate them and return an OBJ
const computeDerivedFields = (courseObj) => {
    let totalCourseMinutes = 0;
    if (!Array.isArray(courseObj.lectures)) courseObj.lectures = [];

    courseObj.lectures = courseObj.lectures.map((lec) => {
        lec = { ...lec };
        lec.duration = lec.duration || {};
        lec.chapters = Array.isArray(lec.chapters) ? lec.chapters : [];

        // normalize chapter totals
        lec.chapters = lec.chapters.map((ch) => {
            ch = { ...ch };
            ch.duration = ch.duration || {};
            const chHours = toNumber(ch.duration.hours);
            const chMins = toNumber(ch.duration.minutes);
            ch.totalMinutes = ch.totalMinutes ? toNumber(ch.totalMinutes) : chHours * 60 + chMins;

            ch.duration.hours = chHours;
            ch.duration.minutes = chMins;
            ch.name = ch.name || "";
            ch.topic = ch.topic || "";
            ch.videoUrl = ch.videoUrl || "";

            return ch;
        });

        const lecHours = toNumber(lec.duration.hours);
        const lecMins = toNumber(lec.duration.minutes);
        const lectureOwnMinutes = lecHours * 60 + lecMins;
        const chaptersMinutes = lec.chapters.reduce((s, c) => s + toNumber(c.totalMinutes, 0), 0);

        lec.totalMinutes = lectureOwnMinutes + chaptersMinutes;

        lec.duration.hours = lecHours;
        lec.duration.minutes = lecMins;

        totalCourseMinutes += lec.totalMinutes;
        lec.title = lec.title || "Untitled lecture";

        return lec;
    });

    courseObj.totalDuration = courseObj.totalDuration || {};
    courseObj.totalDuration.hours = Math.floor(totalCourseMinutes / 60);
    courseObj.totalDuration.minutes = totalCourseMinutes % 60;
    courseObj.totalLectures = Array.isArray(courseObj.lectures) ? courseObj.lectures.length : 0;

    return courseObj;
};

// Upload a buffer to Cloudinary and return the secure URL + public_id
const uploadToCloudinary = (buffer, folder = "skills-platform/courses") => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder, resource_type: "image" },
            (error, result) => {
                if (error) return reject(error);
                resolve({ url: result.secure_url, publicId: result.public_id });
            }
        );
        streamifier.createReadStream(buffer).pipe(stream);
    });
};

// Delete an image from Cloudinary by its public_id
const deleteFromCloudinary = async (publicId) => {
    if (!publicId) return;
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (e) {
        console.warn("Cloudinary delete failed:", e.message);
    }
};

// to get public courses
export const getPublicCourses = async (req, res) => {
    try {
        const { home, type = 'all', limit } = req.query;
        let filter = {};

        if (home === 'true') {
            filter.courseType = 'top';
        }
        else if (type === 'top') {
            filter.courseType = 'top';
        }
        else if (type === 'regular') {
            filter.courseType = 'regular';
        }

        const q = Course.find(filter).sort({ createdAt: -1 });

        if (home === 'true') {
            q.limit(Number(limit || 8));
        }
        else if (limit) {
            q.limit(Number(limit));
        }

        const courses = await q.lean();

        return res.json({
            success: true,
            items: courses
        });
    }

    catch (err) {
        console.log('GetPublicCourses error', err);
        return res.status(500).json({
            success: false,
            error: 'Server Error'
        })
    }
}

// get Courses
export const getCourses = async (req, res) => {
    try {
        const courses = await Course.find().sort({ createdAt: -1 }).lean();
        return res.json({
            success: true,
            courses
        });
    }
    catch (err) {
        console.log('GetCourses error', err);
        return res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
}

const buildCourseUpdate = (body = {}) => {
    const update = {};

    if (body.title !== undefined || body.name !== undefined) {
        update.name = body.title ?? body.name;
    }
    if (body.instructor !== undefined || body.teacher !== undefined) {
        update.teacher = body.instructor ?? body.teacher;
    }
    if (body.description !== undefined || body.overview !== undefined) {
        update.overview = body.description ?? body.overview;
    }
    if (body.thumbnail !== undefined || body.image !== undefined) {
        update.image = body.thumbnail ?? body.image;
    }
    if (body.category !== undefined) {
        update.category = body.category;
    }
    if (body.status !== undefined) {
        update.status = body.status === "published" ? "published" : "draft";
    }
    if (body.pricingType !== undefined) {
        update.pricingType = body.pricingType;
    }
    if (body.price !== undefined) {
        const numericPrice =
            typeof body.price === "object" && body.price !== null
                ? toNumber(body.price.sale ?? body.price.original)
                : toNumber(body.price);

        update.price = {
            original: numericPrice,
            sale: numericPrice,
        };
        update.pricingType = numericPrice > 0 ? "paid" : "free";
    }

    return update;
};

export const updateCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const update = buildCourseUpdate(req.body);

        const course = await Course.findByIdAndUpdate(id, update, {
            new: true,
            runValidators: true,
        }).lean();

        if (!course) return res.status(404).json({
            success: false,
            error: 'Not found'
        });

        return res.json({
            success: true,
            course
        });
    }
    catch (err) {
        console.log('updateCourse error', err);
        return res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
}

export const updateCourseStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const status = req.body?.status === "published" ? "published" : "draft";

        const course = await Course.findByIdAndUpdate(id, { status }, {
            new: true,
            runValidators: true,
        }).lean();

        if (!course) return res.status(404).json({
            success: false,
            error: 'Not found'
        });

        return res.json({
            success: true,
            course
        });
    }
    catch (err) {
        console.log('updateCourseStatus error', err);
        return res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
}

export const getCourseById = async (req, res) => {
    try {
        const { id } = req.params;
        const course = await Course.findById(id).lean();
        if (!course) return res.status(404).json({
            success: false,
            error: 'Not found'
        });

        return res.json({
            success: true,
            course
        });
    }
    catch (err) {
        console.log('GetCoursesById error', err);
        return res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
}

// to create a course
export const createCourse = async (req, res) => {
    try {
        const body = req.body || {};

        // image handling: upload to Cloudinary and store the secure URL + public_id
        let imagePath = body.image || "";
        let imagePublicId = "";
        if (req.file) {
            const uploaded = await uploadToCloudinary(req.file.buffer);
            imagePath = uploaded.url;
            imagePublicId = uploaded.publicId;
        }

        // parse price
        const priceParsed = parseJSONSafe(body.price) ?? (body.price || {});
        const price = {
            original: toNumber(priceParsed.original ?? body["price.original"] ?? 0),
            sale: toNumber(priceParsed.sale ?? body["price.sale"] ?? 0),
        };

        // lectures
        let lectures = parseJSONSafe(body.lectures) ?? body.lectures ?? [];
        if (!Array.isArray(lectures)) lectures = [];

        // normalize lectures & chapters
        lectures = lectures.map((lec) => {
            const lecture = { ...lec };
            lecture.duration = lecture.duration || {};
            lecture.duration.hours = toNumber(lecture.duration.hours);
            lecture.duration.minutes = toNumber(lecture.duration.minutes);

            lecture.chapters = Array.isArray(lecture.chapters) ? lecture.chapters : [];
            lecture.chapters = lecture.chapters.map((ch) => ({
                ...ch,
                duration: {
                    hours: toNumber(ch.duration?.hours),
                    minutes: toNumber(ch.duration?.minutes),
                },
                totalMinutes: toNumber(ch.totalMinutes, 0),
                videoUrl: ch.videoUrl || "",
                name: ch.name || "",
                topic: ch.topic || "",
            }));

            return {
                ...lecture,
                title: lecture.title || "Untitled lecture",
                totalMinutes: toNumber(lecture.totalMinutes, 0),
            };
        });

        const courseObj = {
            name: body.name || "",
            teacher: body.teacher || "",
            image: imagePath,
            rating: toNumber(body.rating, 0),
            pricingType: body.pricingType || "free",
            price,
            overview: body.overview || body.description || "",
            totalDuration:
                parseJSONSafe(body.totalDuration) ??
                { hours: toNumber(body["totalDuration.hours"]), minutes: toNumber(body["totalDuration.minutes"]) },
            totalLectures: toNumber(body.totalLectures, lectures.length),
            lectures,
            courseType: body.courseType || "regular",
            category: body.category || "",
            status: body.status === "published" ? "published" : "draft",
            createdBy: body.createdBy || null,
            imagePublicId,
        };

        computeDerivedFields(courseObj);
        const course = new Course(courseObj);
        await course.save();

        const returned = course.toObject();
        return res.status(201).json({
            success: true,
            course: returned
        })
    }
    catch (err) {
        console.log('createCourse error', err);
        return res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
}

// to delete a course by id
export const deleteCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const course = await Course.findById(id);
        if (!course) return res.status(404).json({
            success: false,
            error: 'Not found'
        });

        // delete image from Cloudinary
        await deleteFromCloudinary(course.imagePublicId);

        await course.deleteOne();
        return res.json({
            success: true,
            message: 'Course Deleted'
        })
    }
    catch (err) {
        console.log('deleteCourse error', err);
        return res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
}

// for rate course by user
export const rateCourse = async (req, res) => {
    try {
        const { userId } = getAuth(req) || {};
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required.'
            });
        }

        const { courseId } = req.params;
        const { rating: rawRating, comment = "" } = req.body;
        const rating = Number(rawRating);

        if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be a number between 1 and 5'
            });
        }
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found.'
            });
        }

        // Find existing rating by this Clerk userId (ratings store userId as string)
        const idx = (course.ratings || []).findIndex(r => String(r.userId) === String(userId));

        if (idx >= 0) {
            // update existing rating
            course.ratings[idx].rating = rating;
            if (typeof comment === "string" && comment.trim().length) {
                course.ratings[idx].comment = comment.trim();
            }
            course.ratings[idx].updatedAt = new Date();
        } else {
            // push new rating object — ensure userId present
            course.ratings.push({
                userId,
                rating,
                comment: typeof comment === "string" ? comment.trim() : ""
            });
        }
        // here if rating is given by user it will update alse it will create a new rating

        // Recompute aggregates (avgRating, totalRatings)
        const ratingsArr = course.ratings || [];
        const totalRatings = ratingsArr.length;
        const sum = ratingsArr.reduce((s, r) => s + (Number(r.rating) || 0), 0);
        const avgRating = totalRatings === 0 ? 0 : Number((sum / totalRatings).toFixed(2));

        course.totalRatings = totalRatings;
        course.avgRating = avgRating; //if a particular course has multi user rating then it will compute the avg

        await course.save();
        return res.json({
            success: true,
            avgRating: course.avgRating,
            totalRatings: course.totalRatings,
            myRating: { userId, rating }
        });
    }

    catch (err) {
        console.error("rateCourse error:", err);
        // if a mongoose validation error includes path ratings.0.userId you can surface it
        if (err && err.name === "ValidationError") {
            return res.status(400).json({ success: false, message: err.message });
        }
        return res.status(500).json({ success: false, message: "Server error" });
    }
}

export const getMyRating = async (req, res) => {
    try {
        const {userId} = getAuth(req) || {};
        if(!userId) return res.status(401).json({
            success: false,
            message: 'Authentication required.'
        });

        const {courseId} = req.params;
        const course = await Course.findById(courseId).lean();
        if(!course) return res.status(404).json({
            success: false,
            message: "Course not found"
        });

        const my = (course.ratings || []).find(r => String(r.userId) === String(userId)) || null;
        return res.json({
            success: true,
            myRating: my ? {rating: my.rating, comment: my.comment} : null
        });
    }
    catch (err) {
        console.log('getMyRating error', err);
        return res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    }
}
