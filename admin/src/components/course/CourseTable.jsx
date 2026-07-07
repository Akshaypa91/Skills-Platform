import React from "react";
import { Edit3, Trash2 } from "lucide-react";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(Number(value) || 0);

const formatDate = (value) => {
  if (!value) return "Not updated";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not updated";

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const CourseTable = ({
  courses,
  updatingStatusId,
  onEdit,
  onDelete,
  onToggleStatus,
}) => (
  <div className="course-table-wrap">
    <table className="course-table">
      <thead>
        <tr>
          <th>Title</th>
          <th>Category</th>
          <th>Instructor</th>
          <th>Price</th>
          <th>Status</th>
          <th>Last Updated</th>
          <th aria-label="Actions"></th>
        </tr>
      </thead>
      <tbody>
        {courses.map((course) => {
          const nextStatus =
            course.status === "published" ? "draft" : "published";

          return (
            <tr key={course.id}>
              <td>
                <div className="course-title-cell">
                  {course.thumbnail ? (
                    <img src={course.thumbnail} alt="" />
                  ) : (
                    <span className="course-thumb-placeholder">
                      {course.title.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span>{course.title}</span>
                </div>
              </td>
              <td>{course.category || "Uncategorized"}</td>
              <td>{course.instructor || "Unassigned"}</td>
              <td>{formatCurrency(course.priceValue)}</td>
              <td>
                <button
                  type="button"
                  className={`status-switch status-switch--${course.status}`}
                  onClick={() => onToggleStatus(course, nextStatus)}
                  disabled={updatingStatusId === course.id}
                  aria-label={`Set ${course.title} to ${nextStatus}`}
                >
                  <span />
                  {updatingStatusId === course.id
                    ? "Updating"
                    : course.status === "published"
                      ? "Published"
                      : "Draft"}
                </button>
              </td>
              <td>{formatDate(course.lastUpdated)}</td>
              <td>
                <div className="row-actions">
                  <button
                    type="button"
                    className="table-action table-action--edit"
                    onClick={() => onEdit(course)}
                  >
                    <Edit3 size={16} />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    className="table-action table-action--delete"
                    onClick={() => onDelete(course)}
                  >
                    <Trash2 size={16} />
                    <span>Delete</span>
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

export default CourseTable;
