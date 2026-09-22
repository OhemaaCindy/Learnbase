import { checkAuthUser } from "@/services/auth-services";
import type { CheckAuthResponse } from "@/types/auth.type";
import { useQuery } from "@tanstack/react-query";
// import Cookies from "js-cookie";
import { Navigate, Outlet } from "react-router";

const Protectedlayout = () => {
  // const token = Cookies.get("token");

  const { data, isLoading, isError, error } = useQuery<
    CheckAuthResponse,
    Error
  >({
    queryKey: ["get-info"],
    queryFn: checkAuthUser,
    // enabled: !!Cookies.get("token"),
  });

  // if (isLoading) {
  //   return <div></div>;
  // }

  // If error or no user data, redirect
  if (isError || isLoading || !data?.user) {
    console.log(error || "no user found");
    return <Navigate to="/" />;
  }

  // if (!token) {
  //   return <Navigate to="/" />;
  // }

  // User is authenticated, show protected content
  return <Outlet />;
};

export default Protectedlayout;
