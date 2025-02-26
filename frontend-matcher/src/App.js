import React, { useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";

const App = () => {
  const [resumes, setResumes] = useState([]);
  const [jobDescription, setJobDescription] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [requestId, setRequestID] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const resultsPerPage = 10; // Max 10 results per page

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

    const formData = new FormData();
    formData.append("job_description", jobDescription);
    resumes.forEach((resume) => formData.append("resumes", resume));

    setLoading(true);
    setUploadProgress(0);

    try {
      const response = await axios.post("http://127.0.0.1:8000/upload/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
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


  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-5xl mx-auto bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-center mb-8 text-blue-700">Resume Matcher</h1>

        {/* File Upload Section */}
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
                        {/* Progress Bar */}
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
    </div>
  );
};

export default App;

// import React, { useState, useEffect } from "react";
// import axios from "axios";

// const App = () => {
//   const [resumes, setResumes] = useState([]);
//   const [jobDescription, setJobDescription] = useState(null);
//   const [results, setResults] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [uploadProgress, setUploadProgress] = useState(0);
//   const [requestId, setRequestID] = useState(null);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [darkMode, setDarkMode] = useState(() => localStorage.getItem("theme") === "dark");
//   const resultsPerPage = 10; // Max 10 results per page

//   useEffect(() => {
//     const storedTheme = localStorage.getItem("theme");
//   if (storedTheme === "dark") {
//     setDarkMode(true);
//     document.documentElement.classList.add("dark");
//   } else {
//     setDarkMode(false);
//     document.documentElement.classList.remove("dark");
//   }
//   }, [darkMode]);
  

//   const handleResumeChange = (e) => {
//     setResumes([...e.target.files]);
//   };

//   const handleJobDescriptionChange = (e) => {
//     setJobDescription(e.target.files[0]);
//   };

//   const handleSubmit = async () => {
//     if (!jobDescription || resumes.length === 0) {
//       alert("Please upload a job description and at least one resume.");
//       return;
//     }

//     const formData = new FormData();
//     formData.append("job_description", jobDescription);
//     resumes.forEach((resume) => formData.append("resumes", resume));

//     setLoading(true);
//     setUploadProgress(0);

//     try {
//       const response = await axios.post("http://127.0.0.1:8000/upload/", formData, {
//         headers: { "Content-Type": "multipart/form-data" },
//         onUploadProgress: (progressEvent) => {
//           const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
//           setUploadProgress(percentCompleted);
//         },
//       });

//       setResults(response.data.results || []);
//       setRequestID(response.data.request_id);
//     } catch (error) {
//       console.error("Error uploading files:", error);
//       alert("An error occurred while processing the files.");
//     } finally {
//       setLoading(false);
//       setUploadProgress(0);
//     }
//   };
//   // Pagination Logic
//   const indexOfLastResult = currentPage * resultsPerPage;
//   const indexOfFirstResult = indexOfLastResult - resultsPerPage;
//   const currentResults = results.slice(indexOfFirstResult, indexOfLastResult);
//   const totalPages = Math.ceil(results.length / resultsPerPage);
//   return (
//     <div className="min-h-screen py-8 px-4 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
//       <div className="max-w-5xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
//         <div className="flex justify-between items-center">
//           <h1 className="text-3xl font-bold">Resume Matcher</h1>
//           <button
//   onClick={() => {
//     setDarkMode((prev) => {
//       const newMode = !prev;
//       localStorage.setItem("theme", newMode ? "dark" : "light"); // Store in localStorage
//       return newMode;
//     });
//     document.documentElement.classList.toggle("dark");
//   }}
//   className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
// >
//   {darkMode ? "🌞 Light Mode" : "🌙 Dark Mode"}
// </button>
//         </div>

//         <div className="space-y-6 mt-6">
//           <div>
//             <label className="block text-sm font-medium">Job Description (PDF)</label>
//             <input
//               type="file"
//               accept=".pdf"
//               onChange={handleJobDescriptionChange}
//               className="mt-1 block w-full border rounded-md p-2 dark:bg-gray-700"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium">Resumes (PDF)</label>
//             <input
//               type="file"
//               accept=".pdf"
//               multiple
//               onChange={handleResumeChange}
//               className="mt-1 block w-full border rounded-md p-2 dark:bg-gray-700"
//             />
//           </div>

//           {loading && (
//             <div className="w-full bg-gray-300 dark:bg-gray-600 rounded-md h-3">
//               <div className="bg-blue-600 h-3 rounded-md" style={{ width: `${uploadProgress}%` }}></div>
//             </div>
//           )}

//           <button
//             onClick={handleSubmit}
//             disabled={loading}
//             className="w-full bg-blue-700 text-white py-2 px-4 rounded-md hover:bg-blue-800 disabled:bg-blue-400"
//           >
//             {loading ? "Processing..." : "Upload and Match"}
//           </button>
//         </div>

//         {results.length > 0 && (
//           <div className="mt-8">
//             <h2 className="text-2xl font-semibold">Results</h2>
//             <div className="overflow-x-auto">
//               <table className="min-w-full bg-white dark:bg-gray-800 border rounded-md">
//                 <thead>
//                   <tr className="bg-gray-100 dark:bg-gray-700">
//                     <th className="py-3 px-6 border-b">Name</th>
//                     <th className="py-3 px-6 border-b">Email</th>
//                     <th className="py-3 px-6 border-b text-center">Score</th>
//                     <th className="py-3 px-6 border-b min-w-60">Resume Profile</th>
//                     <th className="py-3 px-6 border-b">Action</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {results.map((result, index) => (
//                     <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
//                       <td className="py-3 px-6 border-b">{result["Name"] || "N/A"}</td>
//                       <td className="py-3 px-6 border-b">{result["Email"]}</td>
//                       <td className="w-48" text-center>
//                         <div className="relative w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg">
//                           <div
//                             className="absolute h-2 bg-blue-500 rounded-lg"
//                             style={{ width: `${result["Similarity Score"]}%` }}
//                           ></div>
//                         </div>
//                         <span className="ml-2 text-sm">{result["Similarity Score"]}%</span>
//                       </td>
//                       <td className="py-3 px-6 border-b">
//                         <span className="px-3 py-1 bg-blue-200 text-blue-700 rounded-full text-sm">
//                           {result["Category"] || "N/A"}
//                         </span>
//                       </td>
//                       <td className="py-3 px-6 border-b">
//                         <a
//                           href={`http://127.0.0.1:8000/download/${requestId}/${result["Resume Filename"]}`}
//                           target="_blank"
//                           rel="noopener noreferrer"
//                           className="text-blue-600 hover:underline"
//                         >
//                           Download CV
//                         </a>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>

//             {/* Pagination Controls */}
//             {totalPages > 1 && (
//               <div className="flex justify-center mt-4 space-x-2">
//                 <button
//                   onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
//                   disabled={currentPage === 1}
//                   className="px-4 py-2 text-sm bg-gray-300 rounded-md disabled:opacity-50"
//                 >
//                   Previous
//                 </button>
//                 {Array.from({ length: totalPages }, (_, i) => (
//                   <button
//                     key={i}
//                     onClick={() => setCurrentPage(i + 1)}
//                     className={`px-4 py-2 text-sm ${
//                       currentPage === i + 1 ? "bg-blue-600 text-white" : "bg-gray-200"
//                     } rounded-md`}
//                   >
//                     {i + 1}
//                   </button>
//                 ))}
//                 <button
//                   onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
//                   disabled={currentPage === totalPages}
//                   className="px-4 py-2 text-sm bg-gray-300 rounded-md disabled:opacity-50"
//                 >
//                   Next
//                 </button>
//               </div>
//             )}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default App;

