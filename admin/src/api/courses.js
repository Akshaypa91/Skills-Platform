const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://skills-platform-1.onrender.com";

const COURSE_PATHS = ["/api/courses", "/api/course"];

const parseResponse = async (response) => {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data;
};

const requestCourseApi = async (pathBuilder, options = {}) => {
  let lastError;

  for (const basePath of COURSE_PATHS) {
    try {
      const response = await fetch(`${API_BASE_URL}${pathBuilder(basePath)}`, {
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {}),
        },
        ...options,
      });

      if ((response.status === 404 || response.status === 405) && basePath !== COURSE_PATHS.at(-1)) {
        lastError = new Error(`Endpoint unavailable: ${basePath}`);
        continue;
      }

      return parseResponse(response);
    } catch (error) {
      lastError = error;
      if (basePath === COURSE_PATHS.at(-1)) break;
    }
  }

  throw lastError || new Error("Unable to reach course API");
};

export const getCourseId = (course) => course?._id || course?.id;

export const getCourseTitle = (course) =>
  course?.title || course?.name || "Untitled Course";

export const getCourseDescription = (course) =>
  course?.description || course?.overview || "";

export const getCourseInstructor = (course) =>
  course?.instructor || course?.teacher || "";

export const getCourseThumbnail = (course) =>
  course?.thumbnail || course?.thumbnailUrl || course?.image || "";

export const getCourseStatus = (course) => {
  if (course?.status) return course.status;
  if (typeof course?.published === "boolean") {
    return course.published ? "published" : "draft";
  }
  return course?.courseType === "top" ? "published" : "draft";
};

export const getCoursePrice = (course) => {
  if (typeof course?.price === "number" || typeof course?.price === "string") {
    return Number(course.price) || 0;
  }

  return Number(course?.price?.sale ?? course?.price?.original ?? 0) || 0;
};

export const normalizeCourse = (course) => ({
  ...course,
  id: getCourseId(course),
  title: getCourseTitle(course),
  description: getCourseDescription(course),
  category: course?.category || "",
  instructor: getCourseInstructor(course),
  priceValue: getCoursePrice(course),
  thumbnail: getCourseThumbnail(course),
  status: getCourseStatus(course),
  pricingType: course?.pricingType || (getCoursePrice(course) > 0 ? "paid" : "free"),
  courseType: course?.courseType || "regular",
  rating: Number(course?.rating ?? course?.avgRating ?? 0) || 0,
  totalDuration: course?.totalDuration || { hours: 0, minutes: 0 },
  totalLectures: course?.totalLectures || course?.lectures?.length || 0,
  lastUpdated: course?.updatedAt || course?.createdAt || null,
});

export const serializeCoursePayload = (formData) => {
  const price = formData.pricingType === "free" ? 0 : Number(formData.price);

  return {
    title: formData.title.trim(),
    name: formData.title.trim(),
    description: formData.description.trim(),
    overview: formData.description.trim(),
    category: formData.category.trim(),
    price,
    pricingType: formData.pricingType || (price > 0 ? "paid" : "free"),
    thumbnail: formData.thumbnail.trim(),
    image: formData.thumbnail.trim(),
    instructor: formData.instructor.trim(),
    teacher: formData.instructor.trim(),
    status: formData.status,
    courseType: formData.courseType,
    rating: Number(formData.rating) || 0,
    totalDuration: {
      hours: Number(formData.durationHours) || 0,
      minutes: Number(formData.durationMinutes) || 0,
    },
    totalLectures: Number(formData.totalLectures) || 0,
  };
};

export const fetchCourses = async () => {
  const data = await requestCourseApi((basePath) => basePath);
  const rawCourses = data?.courses || data?.items || data?.data || data || [];
  return Array.isArray(rawCourses) ? rawCourses.map(normalizeCourse) : [];
};

export const updateCourse = async (courseId, updates) => {
  const data = await requestCourseApi((basePath) => `${basePath}/${courseId}`, {
    method: "PUT",
    body: JSON.stringify(serializeCoursePayload(updates)),
  });

  return normalizeCourse(data?.course || data?.data || data);
};

export const deleteCourse = async (courseId) =>
  requestCourseApi((basePath) => `${basePath}/${courseId}`, {
    method: "DELETE",
  });

export const updateCourseStatus = async (courseId, status) => {
  const data = await requestCourseApi(
    (basePath) => `${basePath}/${courseId}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }
  );

  return normalizeCourse(data?.course || data?.data || data);
};
