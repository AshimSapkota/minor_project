import React, { useState, useEffect } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import Login from "./Login";
import { useNavigate } from "react-router-dom";

const App = () => {
  const [resumes, setResumes] = useState([]);
  const [jobDescription, setJobDescription] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [requestId, setRequestID] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [role, setRole] = useState(localStorage.getItem("role") || "");
  const [showLandingPage, setShowLandingPage] = useState(true); // New state for landing page
  const resultsPerPage = 10; // Max 10 results per page

  const history = useNavigate();

  useEffect(() => {
    if (token) {
      setIsAuthenticated(true);
      setShowLandingPage(false); // Hide landing page if authenticated
    }
  }, [token]);

  const handleResumeChange = (e) => {
    setResumes([...e.target.files]);
  };

  const handleJobDescriptionChange = (e) => {
    setJobDescription(e.target.files[0]);
  };

  const handleSubmit = async () => {
    if (!jobDescription || resumes.length === 0) {
      alert("Please upload a job description and at least one resume.");
      return;
    }

    if (!isAuthenticated) {
      alert("Please log in to upload files.");
      return;
    }

    const formData = new FormData();
    formData.append("job_description", jobDescription);
    resumes.forEach((resume) => formData.append("resumes", resume));

    setLoading(true);
    setUploadProgress(0);

    try {
      const response = await axios.post("http://127.0.0.1:8000/upload/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`, // Send the token in the header for authentication
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        },
      });

      setResults(response.data.results || []);
      setRequestID(response.data.request_id);
      setCurrentPage(1); // Reset to first page after fetching new results
    } catch (error) {
      console.error("Error uploading files:", error);
      alert("An error occurred while processing the files.");
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const handleLogout = () => {
    // Clear the token from localStorage
    localStorage.removeItem("token");
    // Update the authentication state
    setToken(null);
    setIsAuthenticated(false);
    setShowLandingPage(true); // Show landing page after logout
    history("/"); // Redirect to landing page
  };

  // Pagination Logic
  const indexOfLastResult = currentPage * resultsPerPage;
  const indexOfFirstResult = indexOfLastResult - resultsPerPage;
  const currentResults = results.slice(indexOfFirstResult, indexOfLastResult);
  const totalPages = Math.ceil(results.length / resultsPerPage);

  // Export table data as excel
  const exportToExcel = () => {
    if (results.length === 0) {
      alert("No results to export.");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(results);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Resume Match Results");

    XLSX.writeFile(workbook, "Resume_Match_Results.xlsx");
  };

  // Landing Page Component
  const LandingPage = () => {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
        {/* Hero Section */}
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-blue-700 mb-6">
            Welcome to <span className="text-blue-500">Resu-Match</span>
          </h1>
          <p className="text-gray-700 text-lg mb-8">
            Resu-Match is a powerful tool designed to help you match resumes with job descriptions efficiently. 
            Save time and find the best candidates with our advanced matching algorithm.
          </p>
          <button
            onClick={() => setShowLandingPage(false)} // Hide landing page and show login
            className="bg-blue-700 text-white py-3 px-8 rounded-md hover:bg-blue-800 transition duration-300 text-lg"
          >
            Get Started
          </button>
        </div>
        {/* Features Section */}
        <div className="mt-16 max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-800 text-center mb-8">Why Choose Resu-Match?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="text-blue-600 text-4xl mb-4">🚀</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Fast and Accurate</h3>
              <p className="text-gray-600">
                Our advanced algorithm ensures quick and precise matching of resumes to job descriptions.
              </p>
            </div>
  
            {/* Feature 2 */}
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="text-blue-600 text-4xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Detailed Analytics</h3>
              <p className="text-gray-600">
                Get detailed insights and scores to help you make informed hiring decisions.
              </p>
            </div>
  
            {/* Feature 3 */}
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="text-blue-600 text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Secure and Reliable</h3>
              <p className="text-gray-600">
                Your data is safe with us. We use industry-standard security practices to protect your information.
              </p>
            </div>
          </div>
        </div>
  
        {/* Metrics Section */}
        <div className="mt-16 max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-800 text-center mb-8">Our Impact</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Metric 1 */}
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="text-blue-600 text-4xl font-bold mb-2">100+</div>
              <p className="text-gray-600 text-lg">Companies Using Resu-Match</p>
            </div>
  
            {/* Metric 2 */}
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="text-blue-600 text-4xl font-bold mb-2">50,000+</div>
              <p className="text-gray-600 text-lg">Resumes Processed</p>
            </div>
  
            {/* Metric 3 */}
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <div className="text-blue-600 text-4xl font-bold mb-2">95%</div>
              <p className="text-gray-600 text-lg">Satisfaction Rate</p>
            </div>
          </div>
        </div>
  
        {/* Testimonials Section */}
        <div className="mt-16 max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-800 text-center mb-8">What Our Users Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <p className="text-gray-600 italic mb-4">
                "Resu-Match has transformed our hiring process. It saves us hours of manual work and helps us find the best candidates quickly."
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                  A
                </div>
                <div className="ml-4">
                  <p className="text-gray-800 font-semibold">Alice Johnson</p>
                  <p className="text-gray-600">HR Manager, TechCorp</p>
                </div>
              </div>
            </div>
  
            {/* Testimonial 2 */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <p className="text-gray-600 italic mb-4">
                "The accuracy of Resu-Match is unmatched. It has significantly improved our candidate shortlisting process."
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                  B
                </div>
                <div className="ml-4">
                  <p className="text-gray-800 font-semibold">Bob Smith</p>
                  <p className="text-gray-600">HR Director, Innovate Inc.</p>
                </div>
              </div>
            </div>
  
            {/* Testimonial 3 */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <p className="text-gray-600 italic mb-4">
                "We've seen a 40% reduction in time-to-hire since we started using Resu-Match. Highly recommend it!"
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                  C
                </div>
                <div className="ml-4">
                  <p className="text-gray-800 font-semibold">Catherine Lee</p>
                  <p className="text-gray-600">HR Lead, Global Solutions</p>
                </div>
              </div>
            </div>
          </div>
        </div>
  
        
  
        {/* Footer */}
        <footer className="mt-16 w-full bg-blue-800 text-white py-6">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <p className="text-lg">
              &copy; {new Date().getFullYear()} Resu-Match. All rights reserved.
            </p>
            <p className="text-sm mt-2">
              Made with ❤️ by Your Team
            </p>
          </div>
        </footer>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      {showLandingPage ? (
        // Render the Landing Page if showLandingPage is true
        <LandingPage />
      ) : !isAuthenticated ? (
        // Render the Login component if not authenticated
        <Login setToken={setToken} setRole={setRole} />
      ) : (
        // Render the main application interface if authenticated
        <div className="max-w-5xl mx-auto bg-white p-8 rounded-lg shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-blue-700 flex-grow text-center">
              Resu-Match
            </h1>
            <button
              onClick={handleLogout}
              className="bg-red-700 text-white w-16 h-8 flex items-center justify-center rounded-md hover:bg-red-800"
              title="Logout"
            >
              Logout
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Job Description (PDF)</label>
              <input
                type="file"
                accept=".pdf"
                onChange={handleJobDescriptionChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Resumes (PDF)</label>
              <input
                type="file"
                accept=".pdf"
                multiple
                onChange={handleResumeChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            </div>

            {/* Progress Bar */}
            {loading && (
              <div className="w-full bg-gray-300 rounded-md h-3">
                <div
                  className="bg-blue-600 h-3 rounded-md"
                  style={{ width: `${uploadProgress}%`, transition: "width 0.3s" }}
                ></div>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-blue-700 text-white py-2 px-4 rounded-md hover:bg-blue-800 disabled:bg-blue-400"
            >
              {loading ? "Processing..." : "Upload and Match"}
            </button>
          </div>

          {/* Results Section */}
          {results.length > 0 && (
            <div className="mt-8">
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">Results</h2>
              <button
                onClick={exportToExcel}
                className="mb-4 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                Download as Excel
              </button>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-md shadow-md">
                  <thead>
                    <tr className="bg-blue-100 text-left">
                      <th className="py-3 px-6 border-b">Name</th>
                      <th className="py-3 px-6 border-b">Email</th>
                      <th className="py-3 px-6 border-b">Score</th>
                      <th className="py-3 px-6 border-b min-w-60">Resume Profile</th>
                      <th className="py-3 px-6 border-b">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentResults.map((result, index) => (
                      <tr key={index} className="hover:bg-gray-50 text-gray-700">
                        <td className="py-3 px-6 border-b">{result["Name"] || "N/A"}</td>
                        <td className="py-3 px-6 border-b">{result["Email"]}</td>
                        <td className="w-48">
                          <div className="relative w-full h-2 bg-gray-200 rounded-lg">
                            <div
                              className="absolute h-2 bg-blue-500 rounded-lg"
                              style={{ width: `${result["Similarity Score"]}%` }}
                            ></div>
                          </div>
                          <span className="ml-2 text-sm text-gray-700">{result["Similarity Score"]}%</span>
                        </td>
                        <td className="py-3 px-6 border-b">
                          <span className="px-3 py-1 bg-blue-200 text-blue-700 rounded-full text-sm">
                            {result["Category"] || "N/A"}
                          </span>
                        </td>
                        <td className="py-3 px-6 border-b">
                          <a
                            href={`http://127.0.0.1:8000/download/${requestId}/${result["Resume Filename"]}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            Download CV
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-4 space-x-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 text-sm bg-gray-300 rounded-md disabled:opacity-50"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`px-4 py-2 text-sm ${
                        currentPage === i + 1 ? "bg-blue-600 text-white" : "bg-gray-200"
                      } rounded-md`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 text-sm bg-gray-300 rounded-md disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default App;