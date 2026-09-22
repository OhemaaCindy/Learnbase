import { InputField } from "./inputs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "./button";

import { ImageUpload } from "./image-upload";
import toast from "react-hot-toast";
import {
  UpdateCourseTypeSchema,
  type UpdateCourseFormData,
} from "@/schemas/course-schema";
import { useUpdateCourse } from "@/hooks/course-hook";
import { useQuery } from "@tanstack/react-query";
import type { SingleCourseResponse } from "@/types/courses.types";
import { singleCourse } from "@/services/courses-services";
import { cn } from "@/lib/utils";
import { allTracks } from "@/services/track-services";
import type { TrackResponse } from "@/types/track.type";

interface AddTrackFormProps {
  closeModal: (state: boolean) => void;
  id: string;
}

const UpdateCourseForm = ({ closeModal, id }: AddTrackFormProps) => {
  const { data, isLoading: isCourseLoading } = useQuery<
    SingleCourseResponse,
    Error
  >({
    queryKey: ["get-single-track", id],
    queryFn: () => singleCourse(id as string),
  });

  const { data: tracks, isLoading: isTracksLoading } = useQuery<
    TrackResponse,
    Error
  >({
    queryKey: ["get-all-tracks"],
    queryFn: allTracks,
  });

  const { mutate: updateCourse, isPending, error, isError } = useUpdateCourse();

  const details = data?.course;
  const isStillLoading = isCourseLoading || isTracksLoading || !details?.title;
  const trackList = tracks?.tracks || [];

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<UpdateCourseFormData>({
    resolver: zodResolver(UpdateCourseTypeSchema),
    values: {
      title: details?.title || "",
      description: details?.description || "",
    },
  });
  const selectedImage = watch("image");

  const onSubmit = async (data: UpdateCourseFormData) => {
    updateCourse(
      { id, payload: data },
      {
        onSuccess() {
          toast.success("Course updated successfully");
          closeModal(false);
        },
        onError() {
          toast.error("Failed to update Course");
        },
      }
    );
  };

  return (
    <div>
      {isError && error && (
        <ul className="text-rose-500 mt-2 bg-rose-100 border border-rose-500 rounded-lg px-8 py-2 list-disc">
          {error.errors.map((err, index) => (
            <li key={index}>{err.message}</li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        {isStillLoading ? (
          <div className="animate-pulse mb-4">
            <div className="h-4 bg-blue-100 rounded w-16 mb-2"></div>
            <div className="h-10 bg-blue-100 rounded-md w-full"></div>
          </div>
        ) : (
          <InputField
            label="Title"
            name="title"
            type="text"
            register={register}
            error={errors.title?.message}
            required
          />
        )}

        {isStillLoading ? (
          <div className="animate-pulse mb-4">
            <div className="h-4 bg-blue-100 rounded w-20 mb-2"></div>
            <div className="h-10 bg-blue-100 rounded-md w-full"></div>
          </div>
        ) : (
          <select
            {...register("track")}
            className={cn(
              "w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500",
              "border-gray-300",
              errors.track && "border-red-500 bg-red-50"
            )}
          >
            <option value="">Select a track</option>
            {trackList?.map((track) => (
              <option key={track._id} value={track._id}>
                {track?.name}
              </option>
            ))}
          </select>
        )}
        {errors.track && (
          <p className="text-red-500 text-sm mt-1">{errors.track.message}</p>
        )}

        {isStillLoading ? (
          <div className="animate-pulse mb-4">
            <div className="h-4 bg-blue-100 rounded w-24 mb-2"></div>
            <div className="h-32 bg-blue-100 rounded-md w-full border-2 border-dashed border-gray-400"></div>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Course Image
              {errors.image && <span className="text-red-500">*</span>}
            </label>
            <ImageUpload
              value={selectedImage}
              onImageSelect={(file) => setValue("image", file)}
              error={errors.image?.message}
              maxSize={5}
              placeholder="Upload course image"
              accept="image/*"
              showPreview={true}
            />
          </div>
        )}

        {isStillLoading ? (
          <div className="animate-pulse mb-4">
            <div className="h-4 bg-blue-100 rounded w-20 mb-2"></div>
            <div className="h-10 bg-blue-100 rounded-md w-full"></div>
          </div>
        ) : (
          <InputField
            label="Description"
            name="description"
            type="text"
            register={register}
            error={errors.description?.message}
            required
          />
        )}

        <div className="pt-4">
          <Button
            type="submit"
            disabled={isSubmitting || isPending || isStillLoading}
            className="mb-4 cursor-pointer"
          >
            {isSubmitting || isPending
              ? "Updating Course..."
              : " Update Course "}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default UpdateCourseForm;
