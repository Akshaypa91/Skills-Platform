import React, { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import {
  deleteCourse,
  fetchCourses,
  updateCourse,
  updateCourseStatus,
} from "../../api/courses";
import CourseTable from "./CourseTable";
import EditCourseModal from "./EditCourseModal";
import "./ListCourse.css";

const ListCourse = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [editingCourse, setEditingCourse] = useState(null);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState("");
  const [updatingStatusId, setUpdatingStatusId] = useState(null);

  const loadCourses = async () => {
    setLoading(true);
    try {
      setCourses(await fetchCourses());
    } catch (error) {
      toast.error(error.message || "Failed to load courses.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, rowsPerPage]);

  const filteredCourses = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return courses;

    return courses.filter((course) =>
      course.title.toLowerCase().includes(query)
    );
  }, [courses, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredCourses.length / rowsPerPage));
  const currentPage = Math.min(page, totalPages);
  const firstRowIndex = (currentPage - 1) * rowsPerPage;
  const paginatedCourses = filteredCourses.slice(
    firstRowIndex,
    firstRowIndex + rowsPerPage
  );

  const handleSaveCourse = async (formData) => {
    setSaving(true);
    setModalError("");

    try {
      await updateCourse(editingCourse.id, formData);
      toast.success("Course updated successfully.");
      setEditingCourse(null);
      await loadCourses();
    } catch (error) {
      setModalError(error.message || "Failed to update course.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCourse = async (course) => {
    if (!window.confirm(`Delete "${course.title}"? This cannot be undone.`)) {
      return;
    }

    try {
      await deleteCourse(course.id);
      toast.success("Course deleted successfully.");
      await loadCourses();
    } catch (error) {
      toast.error(error.message || "Failed to delete course.");
    }
  };

  const handleToggleStatus = async (course, nextStatus) => {
    setUpdatingStatusId(course.id);

    try {
      await updateCourseStatus(course.id, nextStatus);
      toast.success(
        nextStatus === "published" ? "Course published." : "Course moved to draft."
      );
      await loadCourses();
    } catch (error) {
      toast.error(error.message || "Failed to update course status.");
    } finally {
      setUpdatingStatusId(null);
    }
  };

  return (
    <main className="list-course-page">
      <Toaster position="top-right" />
      <div className="list-course-shell">
        <header className="list-course-header">
          <div>
            <h1>List Course</h1>
            <p>Review, publish, edit, and remove courses from one admin table.</p>
          </div>
        </header>

        <div className="list-course-toolbar">
          <label className="search-box">
            <Search size={18} />
            <input
              type="search"
              placeholder="Search by title"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </label>

          <select
            className="rows-select"
            value={rowsPerPage}
            onChange={(event) => setRowsPerPage(Number(event.target.value))}
            aria-label="Rows per page"
          >
            <option value={10}>10 rows</option>
            <option value={20}>20 rows</option>
          </select>
        </div>

        <section className="course-panel">
          {loading ? (
            <div className="loading-state" aria-live="polite">
              <div>
                <div className="spinner" />
                <p>Loading courses...</p>
              </div>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="empty-state">
              <div>
                <h2>No courses found</h2>
                <p>
                  {courses.length === 0
                    ? "Create your first course to see it listed here."
                    : "Try a different course title search."}
                </p>
              </div>
            </div>
          ) : (
            <>
              <CourseTable
                courses={paginatedCourses}
                updatingStatusId={updatingStatusId}
                onEdit={(course) => {
                  setModalError("");
                  setEditingCourse(course);
                }}
                onDelete={handleDeleteCourse}
                onToggleStatus={handleToggleStatus}
              />

              <footer className="pagination-bar">
                <span>
                  Showing {firstRowIndex + 1}-
                  {Math.min(firstRowIndex + rowsPerPage, filteredCourses.length)} of{" "}
                  {filteredCourses.length}
                </span>
                <div className="pagination-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => setPage((value) => Math.max(1, value - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() =>
                      setPage((value) => Math.min(totalPages, value + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </div>
              </footer>
            </>
          )}
        </section>
      </div>

      {editingCourse && (
        <EditCourseModal
          key={editingCourse.id}
          course={editingCourse}
          saving={saving}
          error={modalError}
          onSave={handleSaveCourse}
          onClose={() => setEditingCourse(null)}
        />
      )}
    </main>
  );
};

export default ListCourse;
