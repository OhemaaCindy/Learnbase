import { useForm } from "react-hook-form";
import { Button } from "./button";
import { InputField } from "./inputs";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetSchema, type ResetFormData } from "../schemas/auth-schema";
import toast from "react-hot-toast";
import { useResetPasswordAdmin } from "../hooks/auth.hook";
import { useNavigate } from "react-router";

const PasswordResetForm = ({ userId }: { userId: string | undefined }) => {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
  });

  const {
    mutate: resetPassword,
    isPending,
    isError,
    error,
    data,
  } = useResetPasswordAdmin();

  const onSubmit = async (data: ResetFormData) => {
    resetPassword(
      { payload: data, id: userId as string },
      {
        onSuccess() {
          reset();
          toast.success("Reset password link sent to your email");
          navigate("/");
        },
        onError() {
          toast.error("Failed to send link to email.Please try again later");
        },
      }
    );
  };

  return (
    <div className="space-y-4">
      {isError && error && (
        <ul className="text-rose-500 mt-2 bg-rose-100 border border-rose-500 rounded-lg px-8 py-2 list-disc">
          {error.errors.map((err, index) => (
            <li key={index}>{err.message}</li>
          ))}
        </ul>
      )}

      {data && data.success && (
        <p className="text-green-600 mt-2">{data.success}</p>
      )}
      <form onSubmit={handleSubmit(onSubmit)}>
        <InputField
          label="New Password"
          name="password"
          type="password"
          // placeholder="12345"
          register={register}
          error={errors.password?.message}
          required
        />

        <InputField
          label="Confirm Password"
          name="confirmPassword"
          type="password"
          // placeholder="12345"
          register={register}
          error={errors.confirmPassword?.message}
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

export default PasswordResetForm;
