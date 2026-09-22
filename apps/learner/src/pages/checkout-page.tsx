import { useForm } from "react-hook-form";
import {
  User,
  Mail,
  Book,
  Phone,
  MapPin,
  // ChevronRight,
  // ChevronDown,
  // Accessibility,
  Plus,
  TriangleAlert,
} from "lucide-react";
import { InputField } from "@/components/inputs";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { CheckAuthResponse } from "@/types/auth.type";
import { checkAuthUser } from "@/services/auth-services";
// import Cookies from "js-cookie";
import {
  UpdateLearnerTypeSchema,
  type UpdateLearnerFormData,
} from "@/schemas/learner-schema";
import { useUpdateLearner } from "@/hooks/update-learner-hook";
import toast from "react-hot-toast";
import { zodResolver } from "@hookform/resolvers/zod/src/zod.js";
import CompletePurhase from "@/components/complete-purchase-form";
import { useSearchParams } from "react-router";

// Custom utility function for className merging
const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(" ");
};

const CheckoutPage = () => {
  const [searchParams] = useSearchParams();
  const trackId = searchParams.get("id");
  const trackName = searchParams.get("track");
  const trackAmount = searchParams.get("amount");
  const queryClient = useQueryClient();

  const { data: userInfo } = useQuery<CheckAuthResponse, Error>({
    queryKey: ["get-info"],
    queryFn: checkAuthUser,
    // enabled: !!Cookies.get("token"),
  });

  const info = userInfo?.user;

  const profileCompletionCheck =
    info?.disabled === undefined ||
    !info?.contact ||
    !info?.description ||
    !info?.location;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdateLearnerFormData>({
    resolver: zodResolver(UpdateLearnerTypeSchema),
    values: {
      firstName: info?.firstName || "",
      lastName: info?.lastName || "",
      contact: info?.contact || "",
      location: info?.location || "",
      disabled: info?.disabled || false,
      description: info?.description || "",
    },
  });

  const { mutate: updateLearner, isPending } = useUpdateLearner();

  const onSubmit = async (data: UpdateLearnerFormData) => {
    updateLearner(data, {
      onSuccess() {
        queryClient.invalidateQueries({ queryKey: ["get-info"] });

        // console.log("🚀 ~ onSuccess ~ res:", res);
        toast.success("Profile updated successfully");
      },
      onError() {
        toast.error("Failed to update profile");
      },
    });
  };

  return (
    <div className="min-h-screen ">
      {/* Header */}
      <div className="bg-[#01589A] text-white">
        <div className="text-center py-8">
          <h1 className="text-3xl font-medium">Checkout</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {profileCompletionCheck && (
          <div className="flex items-center justify-center ">
            <ul className="   border  border-rose-500 text-rose-500 mt-2 mb-8 bg-rose-100 rounded-lg  py-2 list-disc w-120 px-15">
              <div className="flex gap-4 items-center ">
                <TriangleAlert />
                <span>
                  Please Complete Your Profile To Be Able To Enroll In A Track
                </span>
              </div>
            </ul>
          </div>
        )}
        <div className=" grid grid-cols-1 lg:grid-cols-2 gap-40 w-full bg-white">
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Form Section */}
            <div className="lg:col-span-2  w-2xl">
              <div className=" rounded-lg shadow-sm border border-gray-200 p-6  w-full">
                <div className="space-y-2">
                  <InputField
                    name="firstName"
                    placeholder="First name"
                    register={register}
                    error={errors.firstName?.message}
                    required
                    iconLeft={<User className="h-5 w-5" />}
                  />

                  <InputField
                    name="lastName"
                    placeholder="Last name"
                    register={register}
                    error={errors.lastName?.message}
                    required
                    iconLeft={<User className="h-5 w-5" />}
                  />

                  <InputField
                    name="email"
                    type="email"
                    placeholder={info?.email}
                    register={register}
                    // error={errors?.message}
                    required
                    iconLeft={<Mail className="h-5 w-5" />}
                  />

                  <InputField
                    name="trackName"
                    placeholder={trackName as string}
                    register={register}
                    // error={errors.subject?.message}
                    iconLeft={<Book className="h-5 w-5" />}
                  />

                  <InputField
                    name="contact"
                    type="tel"
                    placeholder="Contact"
                    register={register}
                    error={errors.contact?.message}
                    iconLeft={<Phone className="h-5 w-5" />}
                  />

                  <InputField
                    name="location"
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

                  {/* Description */}
                  <div className="mb-4 w-full">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      {...register("description")}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-transparent outline-none resize-none bg-gray-50"
                      placeholder="Enter description..."
                    />
                    {errors.description && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.description.message}
                      </p>
                    )}
                    <button
                      type="submit"
                      disabled={isSubmitting || isPending}
                      className="bg-[#01589A] hover:bg-blue-200 cursor-pointer text-white px-6 py-3 rounded-sm font-medium flex items-center justify-center gap-2 transition-colors order-2 sm:order-1 mb-6 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                    >
                      {isSubmitting || isPending
                        ? "Saving..."
                        : "Update Profile"}
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>

          {/* Payment Summary */}
          <div className="lg:col-span-1 ">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              Complete payment
            </h2>

            <CompletePurhase
              trackId={trackId as string}
              trackAmount={trackAmount as unknown as number}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
