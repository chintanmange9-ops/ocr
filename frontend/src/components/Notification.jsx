import React, { useEffect } from "react";

export default function Notification({ type, message, onClose }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className={`notification notification-${type}`}>
      <span>{message}</span>
      <button className="notification-close" onClick={onClose} aria-label="Close">&times;</button>
    </div>
  );
}
