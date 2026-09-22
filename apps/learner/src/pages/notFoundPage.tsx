import { Link } from "react-router";

const NotFoundPage = () => {
  return (
    <div className="h-screen bg-gray-50 flex items-center justify-center">
      <div className=" p-6 flex flex-col items-center justify-center text-center -mt-[15%]">
        <img src="/not-found.png" alt="Not Found" className="mx-auto  w-48" />

        <Link
          to="/"
          className="px-6 py-2 rounded-2xl bg-[#02589A] text-white font-medium shadow hover:bg-blue-200 transition"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
