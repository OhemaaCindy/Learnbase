import { AuthFormWrapper } from "../components/authFormWrapper";
import RequestPasswordResetForm from "../components/requestPasswordresetForm";

export const Requestpasswordreset = () => {
  return (
    <div className="relative min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-cyan-500 to-blue-500">
      <div className="absolute inset-0 bg-[url('/images/form-bg.png')] bg-cover bg-center bg-no-repeat"></div>

      <div className="absolute inset-0 bg-white opacity-40"></div>

      <div className="relative z-10 max-w-md w-full">
        <AuthFormWrapper
          title="Admin Reset Password"
          description="Enter your email to reset your password"
          text="Back to homepage"
          page="Back"
          href="/"
        >
          <RequestPasswordResetForm />
        </AuthFormWrapper>
      </div>
    </div>
  );
};
