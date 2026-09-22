import { useForm } from "react-hook-form";
import { Button } from "./button";
import { InputField } from "./inputs";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  registrationSchema,
  type RegistrationFormData,
} from "../schemas/auth-schema";
import { useRegisterAdmin } from "../hooks/auth.hook";
import toast from "react-hot-toast";
import { useNavigate } from "react-router";
import Cookies from "js-cookie";
import { cn } from "@/lib/utils";

const RegistrationForm: React.FC = () => {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
  });

  const {
    mutate,
    isPending,
    error,
    isError,
    data: response,
  } = useRegisterAdmin();

  const onSubmit = async (data: RegistrationFormData) => {
    mutate(data, {
      onSuccess(res) {
        Cookies.set("token", res.token);
        toast.success("Admin created successfully");
        reset();

        navigate(`/otp-verification?email=${data.email}`);
      },
      onError() {
        toast.error("Failed to create account");
      },
    });
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

      {response && response.success && (
        <p className="text-green-600 mt-2">{response.message}</p>
      )}
      <form onSubmit={handleSubmit(onSubmit)}>
        <InputField
          label="First name"
          name="firstName"
          type="text"
          register={register}
          error={errors.firstName?.message}
          required
        />

        <InputField
          label="Last name"
          name="lastName"
          type="text"
          register={register}
          error={errors.lastName?.message}
          required
        />

        <InputField
          label="Email"
          name="email"
          type="email"
          register={register}
          error={errors.email?.message}
          required
        />

        <InputField
          label="Password"
          name="password"
          type="password"
          register={register}
          error={errors.password?.message}
          required
        />

        <InputField
          label="Confirm password"
          name="confirmPassword"
          type="password"
          register={register}
          error={errors.confirmPassword?.message}
          required
        />

        <label className="block text-sm font-medium text-gray-700 mb-1">
          Contact
        </label>
        <div
          className={cn(
            "flex items-center gap-2 w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ",
            errors.contact?.message && "border-red-500 bg-red-50"
          )}
        >
          <p className=" flex items-center gap-1 bg-[#E6E6E6]">
            +233 <span className="-mt-1 text-[#E6E6E6]">|</span>
          </p>
          <input
            className={"w-full outline-none focus:outline-none "}
            type="text"
            {...register("contact")}
          />
        </div>
        {errors.contact && (
          <span style={{ color: "red" }}>{errors?.contact?.message}</span>
        )}

        <div className="pt-4">
          <Button
            type="submit"
            disabled={isSubmitting || isPending}
            className="mb-4 cursor-pointer"
          >
            {isSubmitting || isPending ? "Signing up..." : "Sign up"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default RegistrationForm;
