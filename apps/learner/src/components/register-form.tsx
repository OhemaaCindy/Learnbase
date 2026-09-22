import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { InputField } from "./inputs";
import { useForm } from "react-hook-form";
import { zodResolver } from "./../../node_modules/@hookform/resolvers/zod/src/zod";
import { LockKeyhole, Mail, UserRound } from "lucide-react";
import {
  registrationSchema,
  type RegistrationFormData,
} from "@/schemas/auth-schema";
import { useRegisterAdmin } from "@/hooks/learner-auth-hook";
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import { useNavigate } from "react-router";

export function RegisterForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
  });

  const navigate = useNavigate();

  const {
    mutate,
    isPending,
    error,
    isError,
    data: response,
  } = useRegisterAdmin();

  const onSubmit = (data: RegistrationFormData) => {
    // console.log("🚀 ~ onSubmit ~ data:", data);
    mutate(data, {
      onSuccess(res) {
        Cookies.set("token", res.token);
        console.log("🚀 ~ onSuccess ~  res.token:", res.token);
        reset();
        toast.success("Admin created successfully");

        navigate(`/otp-verification?email=${data.email}`);
      },
      onError() {
        toast.error("Failed to create account");
      },
    });
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-6 max-w-6xl mx-auto mt-7 mb-7",
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

            {response && response.success && (
              <p className="text-green-600 mt-2">{response.message}</p>
            )}
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold w-80">
                  Sign up to get started
                </h1>
              </div>
             
              {/* <form onSubmit={handleSubmit(onSubmit)}> */}
              <InputField
                // label="First Name"
                placeholder="First Name"
                name="firstName"
                type="text"
                register={register}
                error={errors.firstName?.message}
                // required
                iconLeft={<UserRound className="w-4 h-4" />}
              />

              <InputField
                placeholder="Last Name"
                // label="Last Name"
                name="lastName"
                type="text"
                register={register}
                error={errors.lastName?.message}
                // required
                iconLeft={<UserRound className="w-4 h-4" />}
              />
              <InputField
                placeholder="Email"
                name="email"
                type="email"
                register={register}
                error={errors.email?.message}
                required
                iconLeft={<Mail className="w-4 h-4" />}
              />

              <InputField
                placeholder="Password"
                name="password"
                type="password"
                register={register}
                error={errors.password?.message}
                iconLeft={<LockKeyhole className="w-4 h-4" />}
              />

              <InputField
                placeholder="Confirm Password"
                name="confirmPassword"
                type="password"
                register={register}
                error={errors.confirmPassword?.message}
                required
                iconLeft={<LockKeyhole className="w-4 h-4" />}
              />

              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting || isPending}
                  className="mb-4 cursor-pointer w-full p-4 bg-[#01589A] hover:bg-blue-200"
                >
                  {isSubmitting || isPending ? "Signing Up..." : "Sign Up"}
                </Button>
              </div>
              {/* </form> */}

              <div className="text-center text-md">
                Already have create an account ?
                <a
                  href="/login"
                  className="underline underline-offset-4 text-[#01589A] font-semibold"
                >
                  Login
                </a>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
