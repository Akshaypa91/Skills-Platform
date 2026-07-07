import React, { useMemo, useState } from "react";
import {
  BadgeIndianRupee,
  BookOpenText,
  CheckCircle2,
  Clock,
  Image as ImageIcon,
  ListOrdered,
  PenLine,
  Star,
  Tag,
  Upload,
  UserPen,
} from "lucide-react";
import Modal from "./Modal";

const buildInitialForm = (course) => ({
  title: course?.title || "",
  description: course?.description || "",
  category: course?.category || "",
  price: String(course?.priceValue ?? ""),
  thumbnail: course?.thumbnail || "",
  instructor: course?.instructor || "",
  status: course?.status || "draft",
  courseType: course?.courseType || "regular",
  pricingType: course?.pricingType || (course?.priceValue > 0 ? "paid" : "free"),
  rating: Number(course?.rating || 0),
  durationHours: String(course?.totalDuration?.hours ?? ""),
  durationMinutes: String(course?.totalDuration?.minutes ?? ""),
  totalLectures: String(course?.totalLectures ?? ""),
});

const validateCourse = (formData) => {
  const errors = {};
  const price = Number(formData.price);
  const totalLectures = Number(formData.totalLectures);
  const durationHours = Number(formData.durationHours || 0);
  const durationMinutes = Number(formData.durationMinutes || 0);

  if (!formData.title.trim()) errors.title = "Course name is required.";
  if (formData.title.trim().length > 100) {
    errors.title = "Course name must be 100 characters or fewer.";
  }
  if (!formData.instructor.trim()) {
    errors.instructor = "Instructor name is required.";
  }
  if (!formData.category.trim()) errors.category = "Category is required.";
  if (formData.pricingType === "paid" && (!Number.isFinite(price) || price <= 0)) {
    errors.price = "Paid courses need a price greater than 0.";
  }
  if (!Number.isFinite(totalLectures) || totalLectures < 0) {
    errors.totalLectures = "Total lectures must be 0 or more.";
  }
  if (durationHours < 0 || durationMinutes < 0) {
    errors.duration = "Duration cannot be negative.";
  }

  return errors;
};

const FieldError = ({ children }) =>
  children ? <small className="edit-field-error">{children}</small> : null;

const EditCourseModal = ({ course, saving, error, onSave, onClose }) => {
  const initialForm = useMemo(() => buildInitialForm(course), [course]);
  const [formData, setFormData] = useState(initialForm);
  const [fieldErrors, setFieldErrors] = useState({});

  const isDirty = JSON.stringify(formData) !== JSON.stringify(initialForm);

  const requestClose = () => {
    if (isDirty && !window.confirm("Discard unsaved changes?")) return;
    onClose();
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: "" }));
  };

  const setCourseType = (courseType) => {
    setFormData((current) => ({ ...current, courseType }));
  };

  const setRating = (rating) => {
    setFormData((current) => ({ ...current, rating }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = validateCourse(formData);
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    await onSave({
      ...formData,
      price: formData.pricingType === "free" ? "0" : formData.price,
    });
  };

  return (
    <Modal
      title={`Edit ${course?.title || "Course"}`}
      onClose={requestClose}
      maxWidth="1040px"
    >
      <form className="edit-course-form" onSubmit={handleSubmit}>
        {error && <div className="form-error">{error}</div>}

        <section className="edit-card">
          <div className="edit-card__header">
            <span className="edit-card__icon">
              <BookOpenText size={22} />
            </span>
            <div>
              <h3>Course Type</h3>
              <p>Select how this course should appear in the catalog</p>
            </div>
          </div>

          <div className="edit-type-grid">
            <button
              type="button"
              className={`edit-type-option ${
                formData.courseType === "top" ? "is-selected" : ""
              }`}
              onClick={() => setCourseType("top")}
            >
              <span className="radio-dot" />
              Top Course
            </button>
            <button
              type="button"
              className={`edit-type-option ${
                formData.courseType === "regular" ? "is-selected" : ""
              }`}
              onClick={() => setCourseType("regular")}
            >
              <span className="radio-dot" />
              Regular Course
            </button>
          </div>
        </section>

        <section className="edit-card">
          <div className="edit-card__header">
            <span className="edit-card__icon">
              <BookOpenText size={22} />
            </span>
            <div>
              <h3>Course Information</h3>
              <p>Basic details about your course</p>
            </div>
          </div>

          <div className="edit-form-grid">
            <label className="edit-field">
              <span>
                <PenLine size={18} />
                Course Name *
              </span>
              <input
                name="title"
                value={formData.title}
                onChange={handleChange}
                maxLength={100}
                placeholder="e.g., React Masterclass"
                required
              />
              <FieldError>{fieldErrors.title}</FieldError>
            </label>

            <label className="edit-field">
              <span>
                <UserPen size={18} />
                Instructor Name *
              </span>
              <input
                name="instructor"
                value={formData.instructor}
                onChange={handleChange}
                placeholder="e.g., Sophia Miller"
                required
              />
              <FieldError>{fieldErrors.instructor}</FieldError>
            </label>

            <div className="edit-field">
              <span>
                <Star size={18} />
                Course Rating
              </span>
              <div className="edit-rating-box">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setRating(rating)}
                    aria-label={`Set rating to ${rating}`}
                  >
                    <Star
                      size={28}
                      className={rating <= formData.rating ? "is-filled" : ""}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="edit-field">
              <span>
                <Clock size={18} />
                Total Duration
              </span>
              <div className="edit-duration-grid">
                <label>
                  <input
                    name="durationHours"
                    type="number"
                    min="0"
                    value={formData.durationHours}
                    onChange={handleChange}
                    placeholder="Hours"
                  />
                  <small>Hours</small>
                </label>
                <label>
                  <input
                    name="durationMinutes"
                    type="number"
                    min="0"
                    max="59"
                    value={formData.durationMinutes}
                    onChange={handleChange}
                    placeholder="Minutes"
                  />
                  <small>Minutes</small>
                </label>
              </div>
              <FieldError>{fieldErrors.duration}</FieldError>
            </div>

            <label className="edit-field">
              <span>
                <ListOrdered size={18} />
                Total Lectures
              </span>
              <input
                name="totalLectures"
                type="number"
                min="0"
                value={formData.totalLectures}
                onChange={handleChange}
                placeholder="Enter total number of lectures"
              />
              <FieldError>{fieldErrors.totalLectures}</FieldError>
            </label>

            <label className="edit-field">
              <span>
                <BadgeIndianRupee size={18} />
                Pricing Type
              </span>
              <select
                name="pricingType"
                value={formData.pricingType}
                onChange={handleChange}
              >
                <option value="free">Free Course</option>
                <option value="paid">Paid Course</option>
              </select>
            </label>

            {formData.pricingType === "paid" && (
              <label className="edit-field">
                <span>
                  <BadgeIndianRupee size={18} />
                  Price *
                </span>
                <input
                  name="price"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="Enter course price"
                />
                <FieldError>{fieldErrors.price}</FieldError>
              </label>
            )}

            <label className="edit-field">
              <span>
                <Tag size={18} />
                Category *
              </span>
              <input
                name="category"
                value={formData.category}
                onChange={handleChange}
                placeholder="e.g., Web Development"
                required
              />
              <FieldError>{fieldErrors.category}</FieldError>
            </label>

            <label className="edit-field">
              <span>
                <CheckCircle2 size={18} />
                Publish Status
              </span>
              <select name="status" value={formData.status} onChange={handleChange}>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </label>
          </div>

          <label className="edit-field edit-field--full">
            <span>
              <ImageIcon size={18} />
              Course Image URL
            </span>
            <div className="edit-upload-box">
              <Upload size={20} />
              <input
                name="thumbnail"
                type="url"
                value={formData.thumbnail}
                onChange={handleChange}
                placeholder="Paste course image URL"
              />
            </div>
            {formData.thumbnail && (
              <img
                src={formData.thumbnail}
                alt="Course preview"
                className="edit-image-preview"
              />
            )}
          </label>

          <label className="edit-field edit-field--full">
            <span>
              <BookOpenText size={18} />
              Course Overview
            </span>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={5}
              placeholder="Describe what students will learn..."
            />
          </label>
        </section>

        <footer className="edit-course-actions">
          <button type="button" className="secondary-button" onClick={requestClose}>
            Cancel
          </button>
          <button type="submit" className="edit-save-button" disabled={saving}>
            {saving ? "Saving Course..." : `Save ${formData.courseType === "top" ? "Top" : "Regular"} Course`}
          </button>
        </footer>
      </form>
    </Modal>
  );
};

export default EditCourseModal;
