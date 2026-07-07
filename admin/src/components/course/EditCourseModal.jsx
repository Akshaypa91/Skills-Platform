import React, { useMemo, useState } from "react";
import Modal from "./Modal";

const buildInitialForm = (course) => ({
  title: course?.title || "",
  description: course?.description || "",
  category: course?.category || "",
  price: String(course?.priceValue ?? ""),
  thumbnail: course?.thumbnail || "",
  instructor: course?.instructor || "",
  status: course?.status || "draft",
});

const validateCourse = (formData) => {
  const errors = {};
  const price = Number(formData.price);

  if (!formData.title.trim()) errors.title = "Title is required.";
  if (formData.title.trim().length > 100) {
    errors.title = "Title must be 100 characters or fewer.";
  }
  if (!formData.category.trim()) errors.category = "Category is required.";
  if (!Number.isFinite(price) || price <= 0) {
    errors.price = "Price must be a positive number.";
  }

  return errors;
};

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

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = validateCourse(formData);
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    await onSave(formData);
  };

  return (
    <Modal title={`Edit ${course?.title || "Course"}`} onClose={requestClose}>
      <form className="course-form" onSubmit={handleSubmit}>
        {error && <div className="form-error">{error}</div>}

        <label className="form-field">
          <span>Title</span>
          <input
            name="title"
            value={formData.title}
            onChange={handleChange}
            maxLength={100}
            required
          />
          {fieldErrors.title && <small>{fieldErrors.title}</small>}
        </label>

        <label className="form-field">
          <span>Description</span>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
          />
        </label>

        <div className="form-grid">
          <label className="form-field">
            <span>Category</span>
            <input
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
            />
            {fieldErrors.category && <small>{fieldErrors.category}</small>}
          </label>

          <label className="form-field">
            <span>Price</span>
            <input
              name="price"
              type="number"
              min="0.01"
              step="0.01"
              value={formData.price}
              onChange={handleChange}
            />
            {fieldErrors.price && <small>{fieldErrors.price}</small>}
          </label>
        </div>

        <label className="form-field">
          <span>Thumbnail image URL</span>
          <input
            name="thumbnail"
            type="url"
            value={formData.thumbnail}
            onChange={handleChange}
            placeholder="https://example.com/course.jpg"
          />
        </label>

        <div className="form-grid">
          <label className="form-field">
            <span>Instructor</span>
            <input
              name="instructor"
              value={formData.instructor}
              onChange={handleChange}
            />
          </label>

          <label className="form-field">
            <span>Status</span>
            <select name="status" value={formData.status} onChange={handleChange}>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </label>
        </div>

        <footer className="course-form__actions">
          <button type="button" className="secondary-button" onClick={requestClose}>
            Cancel
          </button>
          <button type="submit" className="primary-button" disabled={saving}>
            {saving ? "Saving..." : "Save Course"}
          </button>
        </footer>
      </form>
    </Modal>
  );
};

export default EditCourseModal;
