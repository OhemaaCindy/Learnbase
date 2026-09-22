import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { InputField } from "./inputs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod/src/zod.js";
import { Mail } from "lucide-react";
import { useForgotPasswordAdmin } from "@/hooks/learner-auth-hook";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormData,
} from "@/schemas/auth-schema";
import toast from "react-hot-toast";

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
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
    console.log(data);
    requestReset(
      { ...data, baseResetURL: `${import.meta.env.BASE_URL}/reset-password` },
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
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold w-80 mb-6">
                  Forgot password
                </h1>
                <p> Enter your email address to reset your password</p>
              </div>

              {/* <form> */}
              <InputField
                placeholder="Email"
                name="email"
                type="email"
                register={register}
                error={errors.email?.message}
                // required
                iconLeft={<Mail className="w-4 h-4" />}
              />

              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting || isPending}
                  className="mb-4 cursor-pointer w-full p-4 bg-[#01589A] hover:bg-blue-200"
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
