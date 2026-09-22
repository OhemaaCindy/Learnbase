import { cn } from "@/lib/utils";
import { type ReactNode, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface InputFieldProps {
  label?: string;
  name: string;
  type?: string;
  placeholder?: string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: any;
  error?: string;
  required?: boolean;
  inputStyles?: string;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
}

export const InputField: React.FC<InputFieldProps> = ({
  label,
  name,
  type = "text",
  placeholder,
  register,
  error,
  required = false,
  inputStyles,
  iconLeft,
  iconRight,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  // Final type — handles password toggle
  const inputType =
    type === "password" ? (showPassword ? "text" : "password") : type;

  return (
    <div className="mb-4 w-full">
      {label && (
        <label
          htmlFor={name}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {iconLeft && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {iconLeft}
          </span>
        )}

        <input
          {...register(name)}
          type={inputType}
          id={name}
          placeholder={placeholder}
          className={cn(
            "w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-100",
            iconLeft && "pl-10",
            (iconRight || type === "password") && "pr-10",
            "border-gray-300",
            error && "border-red-500 bg-red-50",
            inputStyles
          )}
        />

        {(type === "password" || iconRight) && (
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            onClick={() =>
              type === "password" ? setShowPassword(!showPassword) : undefined
            }
          >
            {type === "password" ? (
              showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )
            ) : (
              iconRight
            )}
          </button>
        )}
      </div>

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};
