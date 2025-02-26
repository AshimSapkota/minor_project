import React, { useEffect, useState } from "react";
import "./Bear.css";

const Bear = ({ isTypingPassword, isTypingUsername }) => {
  const [eyePosition, setEyePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (event) => {
      const { clientX, clientY } = event;
      setEyePosition({ x: clientX, y: clientY });
    };

    if (isTypingUsername) {
      window.addEventListener("mousemove", handleMouseMove);
    } else {
      setEyePosition({ x: 0, y: 0 });
    }

    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [isTypingUsername]);

  return (
    <div className="bear-container">
      <div className="bear">
        <div className="ears"></div>
        <div className={`eyes ${isTypingPassword ? "cover-eyes" : ""}`}>
          <div className="eye" style={{ transform: `translate(${eyePosition.x / 50}px, ${eyePosition.y / 50}px)` }}></div>
          <div className="eye" style={{ transform: `translate(${eyePosition.x / 50}px, ${eyePosition.y / 50}px)` }}></div>
        </div>
        <div className="hands"></div>
      </div>
    </div>
  );
};

export default Bear;
