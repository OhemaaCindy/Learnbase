import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { InputField } from "./inputs";
import { useForm } from "react-hook-form";
import { zodResolver } from "./../../node_modules/@hookform/resolvers/zod/src/zod";
import { Link, useNavigate } from "react-router";
import { LockKeyhole, Mail } from "lucide-react";
import { loginSchema, type LoginFormData } from "@/schemas/auth-schema";
import { useLoginAdmin } from "@/hooks/learner-auth-hook";
import Cookies from "js-cookie";
import toast from "react-hot-toast";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const {
    mutate: loginUser,
    isPending,
    error,
    isError,
    data,
  } = useLoginAdmin();

  const onSubmit = async (data: LoginFormData) => {
    // console.log(data);
    loginUser(data, {
      onSuccess(res) {
        Cookies.set("token", res.token);

        reset();
        toast.success("Login successful");

        navigate("/dashboard");
      },
      onError() {
        toast.error("Failed to login.Please try again later");
      },
    });
  };
  return (
    <div
      className={cn("flex flex-col gap-6 max-w-6xl mx-auto mt-7", className)}
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
              <p className="text-green-600 mt-2">{data.message}</p>
            )}
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold w-80">
                  Log in to continue your learning journey
                </h1>
              </div>
             
                
              {/* <form> */}
              <InputField
                name="email"
                type="email"
                placeholder="Email"
                register={register}
                error={errors.email?.message}
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
              <Link to="/forgot-password">
                <h1 className="text-[#01589A]">Forgot your password?</h1>
              </Link>

              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting || isPending}
                  className="mb-4 cursor-pointer w-full p-4 bg-[#01589A] hover:bg-blue-200"
                >
                  {isSubmitting || isPending ? "Logging in..." : "Log in"}
                </Button>
              </div>
              {/* </form> */}

              <div className="text-center text-md">
                Need to create an account ?
                <a
                  href="/register"
                  className="underline underline-offset-4 text-[#01589A] font-semibold"
                >
                  Sign up
                </a>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
