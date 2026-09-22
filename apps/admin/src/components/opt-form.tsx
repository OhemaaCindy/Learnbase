import { useForm } from "react-hook-form";
import { Button } from "./button";
import { InputField } from "./inputs";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  otpVerifying,
  // registrationSchema,
  type OtpFormData,
  // type RegistrationFormData,
} from "../schemas/auth-schema";
import { useNavigate } from "react-router";
import { useOtpVerifyAdmin } from "../hooks/auth.hook";
import toast from "react-hot-toast";

const OtpForm: React.FC = () => {
  const navigate = useNavigate();

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
    error,
    isError,
    data,
  } = useOtpVerifyAdmin();

  const onSubmit = async (data: OtpFormData) => {
    sendOtp(
      { token: data.code },
      {
        onSuccess() {
          reset();
          toast.success("Otp verified successfully");

          navigate("/overview");
        },
        onError() {
          toast.error("Failed to send otp.Please try again later");
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
        <p className="text-green-600 mt-2">{data.message}</p>
      )}
      {/* <form onSubmit={handleSubmit(onSubmit)}> */}
      <InputField
        label="Code"
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
          className="mb-4 cursor-pointer"
          onClick={handleSubmit(onSubmit)}
        >
          {isSubmitting || isPending ? "Verifying..." : "Verify"}
        </Button>
      </div>
      {/* </form> */}
    </div>
  );
};

export default OtpForm;
