import { Plus } from "lucide-react";
import { InputField } from "./inputs";
// import toast from "react-hot-toast";
import { zodResolver } from "@hookform/resolvers/zod/src/zod.js";

import { useForm } from "react-hook-form";
// import { useUpdateLearner } from "@/hooks/update-learner-hook";
// import { useLogoutAdmin } from "@/hooks/learner-auth-hook";
// import Cookies from "js-cookie";
// import { useNavigate } from "react-router";
// import { useQueryClient } from "@tanstack/react-query";
import {
  UpdatePasswordTypeSchema,
  type UpdatePasswordFormData,
} from "@/schemas/updatepassword";

const UpdatePasswordForm = () => {
  //   const navigate = useNavigate();

  //   const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    // reset,
    // setValue,
    // watch,
  } = useForm<UpdatePasswordFormData>({
    resolver: zodResolver(UpdatePasswordTypeSchema),
  });
  // const { mutate: updatePassword, isPending } = useUpdateLearner();

  const onSubmit = async (data: UpdatePasswordFormData) => {
    console.log("🚀 ~ onSubmit ~ data:", data);
    // updatePassword(data, {
    //   onSuccess(res) {
    //     toast.success("Profile updated successfully");
    //   },
    //   onError() {
    //     toast.error("Failed to update profile");
    //   },
    // });
  };

  // const { mutate } = useLogoutAdmin();

  // const handleLogout = () => {
  //   // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  //   mutate(), Cookies.remove("token");
  //   navigate("/");
  // };

  return (
    <>
      {/* Change Password Form */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="bg-[#F5F5F5] rounded-sm shadow-sm p-6 sm:p-8 mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">
            Change Password
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <InputField
              label="New Password"
              name="password"
              type="text"
              register={register}
              error={errors.password?.message}
            />
            <InputField
              label="Confirm Password"
              name="confirmPassword"
              type="text"
              register={register}
              error={errors.confirmPassword?.message}
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-[#01589A] hover:bg-blue-200 cursor-pointer text-white px-6 py-3 rounded-sm font-medium flex items-center justify-center gap-2 transition-colors order-2 sm:order-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Updating..." : "Update Password"}
            <Plus className="w-5 h-5" />
          </button>
          {/* 
          <button
            type="button"
            className="bg-[#E6E6E6] hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-sm font-medium flex items-center justify-center gap-2 transition-colors order-1 sm:order-2 cursor-pointer"
            // onClick={handleLogout}
          >
            <LogOut className="w-5 h-5" />
            Logout
          </button> */}
        </div>
      </form>
    </>
  );
};

export default UpdatePasswordForm;
