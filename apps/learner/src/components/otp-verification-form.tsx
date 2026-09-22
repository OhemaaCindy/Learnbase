import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { InputField } from "./inputs";
import { useForm } from "react-hook-form";
import { zodResolver } from "./../../node_modules/@hookform/resolvers/zod/src/zod";
import { otpVerifying, type OtpFormData } from "@/schemas/auth-schema";
import {
  useOtpVerifyAdmin,
  useResendOtpAdmin,
} from "@/hooks/learner-auth-hook";
import toast from "react-hot-toast";
import { useNavigate, useSearchParams } from "react-router";

export function OtpVerificationForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();
  const emailQuery = searchParams.get("email");
  // console.log("🚀 ~ OtpVerificationForm ~ emailQuery:", emailQuery);

  const { mutate: handleOtpResend, isError, error, data } = useResendOtpAdmin();

  const handleResend = () => {
    handleOtpResend(undefined, {
      onSuccess: () => {
        toast.success("OTP sent successfully. Please check your email");
      },
      onError: (error) => {
        toast.error(
          error instanceof Error ? error.message : "Somthing went wrong"
        );
        console.log(error);
      },
    });
  };
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<OtpFormData>({
    resolver: zodResolver(otpVerifying),
  });

  const {
    mutate: sendOtp,
    isPending,
    error: otpError,
    isError: isOtpError,
    data: otpData,
  } = useOtpVerifyAdmin();

  const onSubmit = async (data: OtpFormData) => {
    console.log(data);
    sendOtp(
      { token: data.code },
      {
        onSuccess() {
          reset();
          toast.success("Otp verified successfully");

          navigate("/dashboard");
        },
        onError() {
          toast.error("Failed to send otp.Please try again later");
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

          {/* <form className="p-6 md:p-8"> */}

          <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center text-center">
              <h1 className="text-2xl font-bold w-80 mb-6">OTP Verification</h1>
              <p>
                {" "}
                Verify your accounts using the six digit sent to{" "}
                <span className="text-sky-600">{emailQuery}</span>
              </p>
            </div>

            <form>
              {isOtpError && otpError && (
                <ul className="text-rose-500 mt-2 bg-rose-100 border border-rose-500 rounded-lg px-8 py-2 list-disc">
                  {otpError.errors.map((err, index) => (
                    <li key={index}>{err.message}</li>
                  ))}
                </ul>
              )}

              {otpData && otpData.success && (
                <p className="text-green-600 mt-2">{otpData.message}</p>
              )}
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
              <InputField
                name="code"
                type="code"
                placeholder="12345"
                register={register}
                error={errors.code?.message}
                required
              />

              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting || isPending}
                  className="mb-4 cursor-pointer w-full p-4 bg-[#01589A] hover:bg-blue-200"
                  onClick={handleSubmit(onSubmit)}
                >
                  {isSubmitting || isPending ? "Verying..." : "Verify"}
                </Button>
              </div>
            </form>
            <div className="flex justify-start items-center gap-4">
              <p className="font-semibold">Didn't recieve the otp?</p>
              <button
                className="text-[#01589A] font-bold cursor-pointer"
                onClick={handleResend}
              >
                Resend Otp
              </button>
            </div>
          </div>
          {/* </form> */}
        </CardContent>
      </Card>
    </div>
  );
}
