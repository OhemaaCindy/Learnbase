import { Phone, MapPin, Plus, User2 } from "lucide-react";
import { InputField } from "./inputs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod/src/zod.js";
import { ImageUpload } from "./image-upload";
import {
  UpdateLearnerTypeSchema,
  type UpdateLearnerFormData,
} from "@/schemas/learner-schema";
import toast from "react-hot-toast";
import { useUpdateLearner } from "@/hooks/update-learner-hook";
import { checkAuthUser } from "@/services/auth-services";
import type { CheckAuthResponse } from "@/types/auth.type";
import { useQuery } from "@tanstack/react-query";
import UpdatePasswordForm from "./update-passwordForm";
import Cookies from "js-cookie";
import { cn } from "@/lib/utils";
// import type { ReactNode } from "react";

export default function SettingsTab() {
  // Profile Form

  const { data: userInfo } = useQuery<CheckAuthResponse, Error>({
    queryKey: ["get-info"],
    queryFn: checkAuthUser,
    enabled: !!Cookies.get("token"),
  });

  const info = userInfo?.user;

  const profileCompletionCheck =
    info?.disabled === undefined ||
    !info?.contact ||
    !info?.description ||
    !info?.location;

  // console.log({
  //   disabled: info?.disabled,
  //   contact: info?.contact,
  //   description: info?.description,
  //   location: info?.location,
  // });
  // console.log(
  //   "🚀 ~ SettingsTab ~ profileCompletionCheck:",
  //   profileCompletionCheck
  // );
  // console.log("🚀 ~ SettingsTab ~ info:", info);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    // reset,
    setValue,
    watch,
  } = useForm<UpdateLearnerFormData>({
    resolver: zodResolver(UpdateLearnerTypeSchema),
    defaultValues: {
      firstName: info?.firstName || "",
      lastName: info?.lastName || "",
      contact: info?.contact || "",
      location: info?.location || "",
      disabled: info?.disabled,
      description: info?.description || "",
    },
  });
  const selectedImage = watch("profileImage");
  // const id = info?._id;
  // console.log("🚀 ~ SettingsTab ~ id:", id);
  const { mutate: updateLearner, isPending } = useUpdateLearner();

  const onSubmit = async (data: UpdateLearnerFormData) => {
    updateLearner(data, {
      onSuccess() {
        // console.log("🚀 ~ onSuccess ~ res:", res);
        toast.success("Profile updated successfully");
      },
      onError() {
        toast.error("Failed to update profile");
      },
    });
  };

  return (
    <div className=" min-h-screen py-6 px-4 sm:px-6 lg:px-8 mt-8">
      {profileCompletionCheck && (
        <div className="flex items-center justify-center ">
          <ul className="  text-[#77C053] mt-2 bg-green-50 border border-[#58e611] rounded-lg  py-2 list-disc w-120 px-15">
            <span>
              Please Complete Your Profile To Be Able To Enroll In A Track
            </span>
          </ul>
        </div>
      )}

      <div className="min-h-screen py-6 px-4 sm:px-6 lg:px-8 mt-8">
        <div className="flex justify-between max-w-7xl mx-auto">
          <ImageUpload
            value={selectedImage}
            onImageSelect={(file) => setValue("profileImage", file)}
            error={errors.profileImage?.message}
            maxSize={5}
            // placeholder="Upload course image"
            accept="image/*"
            showPreview={true}
            profile
          />

          <div className="w-4/6">
            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Profile Form */}
              <div className="bg-[#F5F5F5] rounded-sm shadow-sm p-6 sm:p-8 mb-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">
                  Profile
                </h2>

                {/* Profile Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <InputField
                    name="firstName"
                    type="text"
                    placeholder="First Name"
                    register={register}
                    error={errors.firstName?.message}
                    iconLeft={<User2 className="h-5 w-5" />}
                  />

                  <InputField
                    name="lastName"
                    type="text"
                    placeholder="Last Name"
                    register={register}
                    error={errors.lastName?.message}
                    iconLeft={<User2 className="h-5 w-5" />}
                  />

                  <InputField
                    name="contact"
                    type="text"
                    placeholder="Contact"
                    register={register}
                    error={errors.contact?.message}
                    iconLeft={<Phone className="h-5 w-5" />}
                  />

                  <InputField
                    name="location"
                    type="text"
                    placeholder="Location"
                    register={register}
                    error={errors.location?.message}
                    iconLeft={<MapPin className="h-5 w-5" />}
                  />
                   <select
                    {...register("disabled", {
                      setValueAs: (value) => value === "true",
                    })}
                    name="disabled"
                    className={cn(
                      "w-full h-10 border rounded-md shadow-sm overflow-y-auto",
                      errors.disabled && "border-red-500 bg-red-50",
                    )}
                  >
                    <option value="">Do you have disability?</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>

                  <div className="mb-4 w-full">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      {...register("description")}
                      name="description"
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-transparent outline-none resize-none bg-gray-50"
                      placeholder="Enter description..."
                    />
                    {errors.description && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.description.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || isPending}
                className="bg-[#01589A] hover:bg-blue-200 cursor-pointer text-white px-6 py-3 rounded-sm font-medium flex items-center justify-center gap-2 transition-colors order-2 sm:order-1 mb-6 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting || isPending
                  ? "Saving..."
                  : "Save Profile Changes"}
                <Plus className="w-5 h-5" />
              </button>
            </form>
            {/* Change Password Form */}
            <UpdatePasswordForm />
          </div>
        </div>
      </div>
    </div>
  );
}
