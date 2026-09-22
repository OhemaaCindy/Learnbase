import { InputField } from "./inputs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "./button";
import {
  AddTrackTypeSchema,
  type AddTrackFormData,
} from "@/schemas/track-schema";
import { ImageUpload } from "./image-upload";
import { useAddTrack } from "@/hooks/track.hook";
import toast from "react-hot-toast";

interface AddTrackFormProps {
  closeModal: (state: boolean) => void;
}

const AddTrackForm = ({ closeModal }: AddTrackFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<AddTrackFormData>({
    resolver: zodResolver(AddTrackTypeSchema),
    defaultValues: {
      name: "",
      price: "",
      duration: "",
      instructor: "",
      description: "",
    },
  });
  const selectedImage = watch("image");

  const { mutate: addTrack, isPending, error, isError } = useAddTrack();

  const onSubmit = async (data: AddTrackFormData) => {
    addTrack(data, {
      onSuccess() {
        reset();
        closeModal(false);
        toast.success("Track created successfully");
      },
      onError() {
        toast.error("Failed to create Track");
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
          label="Track name"
          name="name"
          type="text"
          register={register}
          error={errors.name?.message}
          required
        />

        <InputField
          label="Price$"
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
          </label>
          <ImageUpload
            value={selectedImage}
            onImageSelect={(file) => setValue("image", file)}
            error={errors.image?.message}
            maxSize={5}
            placeholder="Upload track image"
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
            {isSubmitting || isPending ? "Creating Track..." : "Create Track"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddTrackForm;
