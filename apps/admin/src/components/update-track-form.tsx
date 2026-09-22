import { InputField } from "./inputs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "./button";
import { ImageUpload } from "./image-upload";
import { useUpdateTrack } from "@/hooks/track.hook";
import {
  UpdateTrackTypeSchema,
  type UpdateTrackFormData,
} from "@/schemas/track-schema";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import type { SingleTrackResponse } from "@/types/track.type";
import { singleTrack } from "@/services/track-services";

interface UpdateTrackFormProps {
  closeModal: (state: boolean) => void;
}

const UpdateTrackForm = ({ closeModal }: UpdateTrackFormProps) => {
  const navigate = useNavigate();
  const params = useParams();
  const id = params.id;

  const { data } = useQuery<SingleTrackResponse, Error>({
    queryKey: ["get-single-track", id],
    queryFn: () => singleTrack(id as string),
  });

  const details = data?.track;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    // reset,
    setValue,
    watch,
  } = useForm<UpdateTrackFormData>({
    resolver: zodResolver(UpdateTrackTypeSchema),
    defaultValues: {
      name: details?.name || "",
      price: details?.price ? String(details.price) : "",
      duration: details?.duration || "",
      instructor: details?.instructor || "",
      // Add this to your defaultValues
      description: details?.description || "",
      // image: details?.image,
    },
  });

  const selectedImage = watch("image");

  const { mutate: updateTrack, isPending, error, isError } = useUpdateTrack();

  const onSubmit = async (data: UpdateTrackFormData) => {
    if (!id) {
      toast.error("");
      return;
    }

    updateTrack(
      { id, payload: data },
      {
        onSuccess() {
          // reset();
          closeModal(false);
          navigate("/tracks");
          toast.success("Track updated successfully");
        },
        onError() {
          toast.error("Failed to update Track");
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
        <InputField
          label="Track name"
          name="name"
          type="text"
          register={register}
          error={errors.name?.message}
          required
        />

        <InputField
          label="Price"
          name="price"
          type="text"
          register={register}
          error={errors.price?.message}
          required
        />

        <InputField
          label="Duration"
          name="duration"
          type="text"
          register={register}
          error={errors.duration?.message}
          required
        />

        <InputField
          label="Instructor"
          name="instructor"
          type="text"
          register={register}
          error={errors.instructor?.message}
          required
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Track Image
            {errors.image && <span className="text-red-500">*</span>}
          </label>
          <ImageUpload
            value={selectedImage}
            onImageSelect={(file) => setValue("image", file)}
            error={errors.image?.message}
            maxSize={5}
            placeholder="Upload track image"
            accept="image/*"
            showPreview={true}
            tempPreviewUrl={details?.image}
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
            {isSubmitting || isPending ? "Updating Track..." : "Update Track"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default UpdateTrackForm;
