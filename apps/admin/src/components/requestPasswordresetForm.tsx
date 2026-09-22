import { useForm } from "react-hook-form";
import { Button } from "./button";
import { InputField } from "./inputs";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormData,
} from "../schemas/auth-schema";
import toast from "react-hot-toast";

import { useForgotPasswordAdmin } from "../hooks/auth.hook";

const RequestPasswordResetForm: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const { mutate: requestReset, isPending } = useForgotPasswordAdmin();

  const onSubmit = async (data: ForgotPasswordFormData) => {
    requestReset(
      {
        ...data,
        baseResetURL: `${import.meta.env.VITE_CLIENT_URL}/reset-password`,
      },
      {
        onSuccess() {
          reset();
          toast.success("Forgot password request sent successfully");

          // navigate("/reset-password");
        },
        onError() {
          toast.error("Failed to send request.Please try again later");
        },
      }
    );
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit(onSubmit)}>
        <InputField
          label="Email"
          name="email"
          type="email"
          // placeholder="12345"
          register={register}
          error={errors.email?.message}
          required
        />

        <div className="pt-4">
          <Button
            type="submit"
            disabled={isSubmitting || isPending}
            className="mb-4 cursor-pointer"
            // onClick={handleSubmit(onSubmit)}
          >
            {isSubmitting || isPending
              ? "Resetting password..."
              : "Reset password"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default RequestPasswordResetForm;
