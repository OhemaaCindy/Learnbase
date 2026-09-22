import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { InputField } from "./inputs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod/src/zod.js";
import { Eye, LockKeyholeIcon } from "lucide-react";
import { resetSchema, type ResetFormData } from "@/schemas/auth-schema";
import toast from "react-hot-toast";
import { useResetPasswordAdmin } from "@/hooks/learner-auth-hook";
import { useNavigate } from "react-router";

interface ResetPasswordFormProps extends React.ComponentProps<"div"> {
  userId?: string; // optional
}

export function ResetPasswordForm({
  className,
  userId,
  ...props
}: ResetPasswordFormProps) {
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
    // console.log(data);
    resetPassword(
      { payload: data, id: userId as string },
      {
        onSuccess() {
          reset();
          toast.success("Password reset successfully");
          navigate("/");
        },
        onError() {
          toast.error("Failed to reset password.Please try again later");
        },
      }
    );
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-6 max-w-6xl mx-auto mt-20 mb-7",
        className
      )}
      {...props}
    >
      <Card className="overflow-hidden p-0 shadow-none border-none">
        <CardContent className="grid p-0 md:grid-cols-2">
          <div className="flex justify-center items-center">
            <img
              src="/Ellipse.png"
              alt="Image"
              className="h-90 w-90 object-cover hidden md:block"
            />
          </div>

          <form className="p-6 md:p-8" onSubmit={handleSubmit(onSubmit)}>
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
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold w-80 mb-6">Reset password</h1>
                <p> Create a new password and get started</p>
              </div>

              {/* <form> */}
              <InputField
                placeholder="Password"
                name="password"
                type="password"
                register={register}
                error={errors.password?.message}
                // required
                iconLeft={<LockKeyholeIcon className="w-4 h-4" />}
                iconRight={<Eye className="w-4 h-4" />}
              />
              <InputField
                placeholder="Confirm"
                name="confirmPassword"
                type="password"
                register={register}
                error={errors.password?.message}
                // required
                iconLeft={<LockKeyholeIcon className="w-4 h-4" />}
                iconRight={<Eye className="w-4 h-4" />}
              />

              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting || isPending}
                  className="mb-4 cursor-pointer w-full p-4 bg-[#01589A] hover:bg-blue-100"
                >
                  {isSubmitting || isPending
                    ? "Resetting..."
                    : "Reset Password"}
                </Button>
              </div>
              {/* </form> */}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
