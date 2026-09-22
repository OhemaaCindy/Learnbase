import { InputField } from "./inputs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "./button";

import { ImageUpload } from "./image-upload";
import toast from "react-hot-toast";
import {
  AddCourseTypeSchema,
  type AddCourseFormData,
} from "@/schemas/course-schema";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import type { TrackResponse } from "@/types/track.type";
import { allTracks } from "@/services/track-services";
import { useAddCourse } from "@/hooks/course-hook";

interface AddCourseFormProps {
  closeModal: (state: boolean) => void;
}

const AddCourseForm = ({ closeModal }: AddCourseFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<AddCourseFormData>({
    resolver: zodResolver(AddCourseTypeSchema),
    defaultValues: {
      title: "",
      track: "",
      description: "",
    },
  });
  const selectedImage = watch("image");

  const { data, isLoading } = useQuery<TrackResponse, Error>({
    queryKey: ["get-all-tracks"],
    queryFn: allTracks,
  });

  const trackList = data?.tracks || [];

  const { mutate: addCourse, isPending, error, isError } = useAddCourse();

  const onSubmit = async (data: AddCourseFormData) => {
    addCourse(data, {
      onSuccess() {
        reset();
        closeModal(false);
        toast.success("Course created successfully");
      },
      onError() {
        toast.error("Failed to create Course");
      },
    });
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
        <InputField
          label="Title"
          name="title"
          type="text"
          register={register}
          error={errors.title?.message}
          required
        />

        <select
          {...register("track")}
          className={cn(
            "w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500",
            "border-gray-300",
            errors.track && "border-red-500 bg-red-50"
          )}
        >
          <option value="">Select a track</option>
          {isLoading ? (
            <span>Loading tracks....</span>
          ) : (
            trackList?.map((track) => (
              <option key={track._id} value={track._id}>
                {track?.name}
              </option>
            ))
          )}
        </select>
        {errors.track && (
          <p className="text-red-500 text-sm mt-1">{errors.track.message}</p>
        )}

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
        <InputField
          label="Description"
          name="description"
          type="text"
          register={register}
          error={errors.description?.message}
          required
        />
        <div className="pt-4">
          <Button
            type="submit"
            disabled={isSubmitting || isPending}
            className="mb-4 cursor-pointer"
          >
            {isSubmitting || isPending ? "Creating Course..." : "Create Course"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddCourseForm;
