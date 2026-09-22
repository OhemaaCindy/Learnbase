import { cn } from "@/lib/utils";

interface InputFieldProps {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: any;
  error?: string;
  required?: boolean;
  inputStyles?: string;
  disabled?: boolean;
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
  disabled = false,
}) => {
  const registerOptions = type === "number" ? { valueAsNumber: true } : {};

  return (
    <div className="mb-4 w-full">
      <label
        htmlFor={name}
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        {...register(name, registerOptions)}
         disabled={disabled}
        type={type}
        id={name}
        placeholder={placeholder}
        className={cn(
          "w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500",
          "border-gray-300",
          error && "border-red-500 bg-red-50",
          inputStyles
        )}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};
