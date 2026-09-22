// // import { CourseCard } from "@/components/track-cards";
// import { Monitor, BarChart3, Cloud } from "lucide-react";
// import { EnrolledCourseCard } from "./enrolled-course-cards";
// // import ExploreSection from "@/explore-section";
// import RateSection from "./rate-section";
// import { useEffect, useState } from "react";
// // import { useSearchParams } from "react-router";

// const LearnerDashboardPage = () => {
//   const [trackId, setTrackId] = useState<string | null>(null);

//   useEffect(() => {
//     const stored = localStorage.getItem("trackId");
//     if (stored) {
//       setTrackId(stored);
//     }
//   }, []);

//   const courses = [
//     {
//       title: "React Js",
//       description: "Quick introduction to React Js",

//       bgColor: "bg-gradient-to-br from-blue-200 to-blue-300",
//       icon: Monitor,
//       iconColor: "text-blue-600",
//     },
//     {
//       title: "Node Js",
//       description: "Quick introduction to Node Js",

//       bgColor: "bg-gradient-to-br from-purple-200 to-purple-300",
//       icon: BarChart3,
//       iconColor: "text-purple-600",
//     },
//     {
//       title: "Next JS",
//       description: "Quick introduction to Next Js.",

//       bgColor: "bg-gradient-to-br from-orange-200 to-orange-300",
//       icon: Cloud,
//       iconColor: "text-orange-600",
//     },
//     {
//       title: "Next JS",
//       description: "Quick introduction to Next Js.",

//       bgColor: "bg-gradient-to-br from-orange-200 to-orange-300",
//       icon: Cloud,
//       iconColor: "text-orange-600",
//     },
//   ];
//   return (
//     <>
//       <div className="bg-[#02589A]">
//         <div className="min-h-screen bg-white py-8">
//           <div className="max-w-7xl mx-auto ">
//             {/* Page Title */}
//             <p className="text-xl font-bold text-gray-900 mb-8">
//               Enrolled Courses
//             </p>
//             <h1 className="text-2xl font-bold text-gray-900 mb-8">
//               Software Development Track
//             </h1>

//             {/* Course Grid */}
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
//               {courses.map((course, index) => (
//                 <EnrolledCourseCard key={index} {...course} />
//               ))}
//             </div>
//             <p>Track ID: {trackId ?? "No track purchased"}</p>
//           </div>
//         </div>
//       </div>
//       <div className="my-10 md:mt-0 py-6 ">
//         <RateSection />
//       </div>
//     </>
//   );
// };

// export default LearnerDashboardPage;

import { useEffect, useState } from "react";

const Dashboard = () => {
  const [trackId, setTrackId] = useState<string | null>(null);

  useEffect(() => {
    // 1. Try query params (in case you decide to add ?trackId later)
    const params = new URLSearchParams(window.location.search);
    const queryTrackId = params.get("trackId");

    if (queryTrackId) {
      setTrackId(queryTrackId);
      localStorage.setItem("trackId", queryTrackId); // keep it safe
    } else {
      // 2. Fallback: get from localStorage
      const stored = localStorage.getItem("trackId");
      if (stored) {
        setTrackId(stored);
      }
    }
  }, []);

  return (
    <div>
      <h1>Dashboard</h1>
      {trackId ? <p>Track ID: {trackId}</p> : <p>No track selected</p>}
    </div>
  );
};

export default Dashboard;
