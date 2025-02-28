import React from "react";
import { useNavigate } from "react-router-dom";

const LandingPage = () => {
  const history = useNavigate();

  const handleLoginClick = () => {
    history("/login");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center">
        <h1 className="text-4xl font-bold text-blue-700 mb-6">Welcome to Resume Matcher</h1>
        <p className="text-gray-700 mb-8">
          Resume Matcher is a powerful tool that helps you match resumes with job descriptions efficiently.
        </p>
        <button
          onClick={handleLoginClick}
          className="bg-blue-700 text-white py-2 px-6 rounded-md hover:bg-blue-800"
        >
          Login
        </button>
      </div>
    </div>
  );
};

export default LandingPage;