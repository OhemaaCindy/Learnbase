import { AuthFormWrapper } from "../components/authFormWrapper";
import LoginForm from "../components/LoginForm";

export const LoginPage = () => {
  return (
    <div className="relative min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-cyan-500 to-blue-500">
      <div className="absolute inset-0 bg-[url('/images/form-bg.png')] bg-cover bg-center bg-no-repeat"></div>

      <div className="absolute inset-0 bg-white opacity-40"></div>

      <div className="relative z-10 max-w-md w-full">
        <AuthFormWrapper
          title="Admin Login"
          description="Login to Manage and Access the Dashboard Effortlessly."
          text="Don't have an account?"
          page="Sign Up"
          href="/register"
        >
          <LoginForm />
        </AuthFormWrapper>
      </div>
    </div>
  );
};
