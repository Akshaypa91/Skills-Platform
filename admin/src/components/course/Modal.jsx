import React, { useEffect } from "react";
import { X } from "lucide-react";

const Modal = ({ title, children, onClose, maxWidth = "720px" }) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const handleBackdropMouseDown = (event) => {
    if (event.target === event.currentTarget) onClose();
  };

  return (
    <div className="course-modal-backdrop" onMouseDown={handleBackdropMouseDown}>
      <section
        className="course-modal"
        style={{ maxWidth }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="course-modal-title"
      >
        <header className="course-modal__header">
          <h2 id="course-modal-title">{title}</h2>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
};

export default Modal;
