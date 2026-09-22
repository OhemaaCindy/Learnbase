import { InputField } from "./inputs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ImageUpload } from "./image-upload";
import toast from "react-hot-toast";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import UpdatePasswordForm from "./update-password-form";
import {
  UpdateAdminTypeSchema,
  type UpdateAdminFormData,
} from "@/schemas/auth-schema";
import { useQuery } from "@tanstack/react-query";
import type { CheckAuthResponse } from "@/types/types";
import { checkAuthUser } from "@/services/auth-services";
import Cookies from "js-cookie";
import { useUpdateAdmin } from "@/hooks/update-admin-hook";
import { InputShimmer, TextareaShimmer } from "./input-textarea-shimmer";
import { useEffect } from "react";

const UpdateProfileForm = () => {
  const { data: userInfo, isLoading } = useQuery<CheckAuthResponse, Error>({
    queryKey: ["get-info"],
    queryFn: checkAuthUser,
    enabled: !!Cookies.get("token"),
  });

  const info = userInfo?.user;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<UpdateAdminFormData>({
    resolver: zodResolver(UpdateAdminTypeSchema),
    defaultValues: {
      firstName: info?.firstName || "",
      lastName: info?.lastName || "",
      contact: info?.contact || "",
      location: info?.location || "",
      disabled: info?.disabled,
      description: info?.description || "",
    },
  });

  useEffect(() => {
    if (info) {
      reset({
        firstName: info.firstName ?? "",
        lastName: info.lastName ?? "",
        contact: info.contact ?? "",
        location: info.location ?? "",
        disabled: info.disabled ?? false,
        description: info.description ?? "",
      });
    }
  }, [info, reset]);

  const selectedImage = watch("profileImage");
  // const id = info?._id;
  const { mutate: updateAdmin, isPending } = useUpdateAdmin();

  const onSubmit = async (data: UpdateAdminFormData) => {
    // console.log("Disabled value (boolean):", data.disabled);
    updateAdmin(data, {
      onSuccess() {
        toast.success("Profile updated successfully");
      },
      onError() {
        toast.error("Failed to update profile");
      },
    });
  };

  return (
    <div className="min-h-screen py-4 px-4 sm:py-6 sm:px-6 lg:px-8 w-full">
      <div className="min-h-screen py-4 px-2 sm:py-6 sm:px-4 lg:px-8 mt-4 sm:mt-8">
        <div className="flex flex-col lg:flex-row lg:justify-between gap-6 lg:gap-8 max-w-7xl mx-auto">
          {/* Image Upload Section */}
          <div className="w-full lg:w-auto flex justify-center lg:justify-start">
            <ImageUpload
              value={selectedImage}
              onImageSelect={(file) => setValue("profileImage", file)}
              error={errors.profileImage?.message}
              tempPreviewUrl="https://images.pexels.com/photos/20624891/pexels-photo-20624891.jpeg"
              maxSize={5}
              accept="image/*"
              showPreview={true}
              profile
            />
          </div>

          {/* Form Section */}
          <div className="w-full lg:w-4/6">
            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Profile Form */}
              <div className="bg-[#F5F5F5] rounded-sm shadow-sm p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
                {/* Profile Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  {isLoading ? (
                    <>
                      <InputShimmer />
                      <InputShimmer />
                      <InputShimmer />
                      <InputShimmer />
                      <InputShimmer />
                      <TextareaShimmer />
                    </>
                  ) : (
                    <>
                      <InputField
                        label="First Name"
                        name="firstName"
                        type="text"
                        disabled
                        register={register}
                        error={errors.firstName?.message}
                      />
                      <InputField
                        label="Last Name"
                        disabled
                        name="lastName"
                        type="text"
                        register={register}
                        error={errors.lastName?.message}
                      />
                      <InputField
                        label="Contact"
                        name="contact"
                        type="text"
                        register={register}
                        error={errors.contact?.message}
                      />

                      <InputField
                        label="Location"
                        name="location"
                        type="text"
                        register={register}
                        error={errors.location?.message}
                      />

                      <select
                        {...register("disabled", {
                          setValueAs: (val) => val === "true",
                        })}
                        className={cn(
                          "w-full h-10 px-3 border rounded-md shadow-sm",
                          errors.disabled && "border-red-500 bg-red-50",
                        )}
                      >
                        <option value="false">false</option>
                        <option value="true">true</option>
                      </select>

                      <div className="mb-4 w-full md:col-span-2">
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
                    </>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || isPending || isLoading}
                className="w-full sm:w-auto bg-[#01589A] hover:bg-blue-200 cursor-pointer text-white px-6 py-3 rounded-sm font-medium flex items-center justify-center gap-2 transition-colors order-2 sm:order-1 mb-6 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Loading...
                  </div>
                ) : isSubmitting || isPending ? (
                  "Saving..."
                ) : (
                  "Save Profile Changes"
                )}
                {!isLoading && <Plus className="w-5 h-5" />}
              </button>
            </form>
            {/* Change Password Form */}
            <UpdatePasswordForm />
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateProfileForm;
