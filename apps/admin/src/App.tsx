import { createBrowserRouter, RouterProvider } from "react-router";
import RegistrationPage from "./pages/register-page";
import { LoginPage } from "./pages/login-page";
import { Otpverification } from "./pages/otp-verification";
import { Requestpasswordreset } from "./pages/request-password-reset-form";
import { ResetPassword } from "./pages/reset-password";
import { Toaster } from "react-hot-toast";
import Invoices from "./pages/invoices-page";
import Learners from "./pages/learners-page";
import Track from "./pages/tracks-page";
import Courses from "./pages/courses-page";
import Report from "./pages/report-page";
import Dashboardlayout from "./pages/layouts/dashboard-layout";
import Overview from "./pages/overview";
import Authlayout from "./pages/layouts/auth-layout";
import TrackDetails from "./pages/track-details";
import ProfilePage from "./pages/profile-page";

function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Authlayout />,
      children: [
        {
          index: true,
          element: <LoginPage />,
        },
        {
          path: "register",
          element: <RegistrationPage />,
        },
        {
          path: "otp-verification",
          element: <Otpverification />,
        },
        {
          path: "request-password-reset",
          element: <Requestpasswordreset />,
        },
        {
          path: "reset-password/:id",
          element: <ResetPassword />,
        },
      ],
    },
    {
      path: "/",
      element: <Dashboardlayout />,
      children: [
        {
          path: "overview",
          element: <Overview />,
        },
        {
          path: "invoices",
          element: <Invoices />,
        },
        {
          path: "learners",
          element: <Learners />,
        },
        {
          path: "tracks",
          element: <Track />,
        },
        {
          path: "tracks/:id",
          element: <TrackDetails />,
        },
        {
          path: "courses",
          element: <Courses />,
        },
        {
          path: "report",
          element: <Report />,
        },
        {
          path: "profile",
          element: <ProfilePage />,
        },
      ],
    },
  ]);

  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="top-center" reverseOrder={false} />
    </>
  );
}

export default App;
