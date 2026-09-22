import { AuthFormWrapper } from "../components/authFormWrapper";
import RegistrationForm from "../components/registrationForm";

const RegistrationPage: React.FC = () => {
  return (
    <div className="relative min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-cyan-500 to-blue-500">
      <div className="absolute inset-0 bg-[url('/images/form-bg.png')] bg-cover bg-center bg-no-repeat"></div>

      <div className="absolute inset-0 bg-white opacity-40"></div>

      <div className="relative z-10 max-w-md w-full">
        <AuthFormWrapper
          title="Admin SignUp"
          description="Create Your  Account to Manage and Access 
          the Dashboard Effortlessly.."
          text="Already have an account?"
          page="Login"
          href="/"
        >
          <RegistrationForm />
        </AuthFormWrapper>
      </div>
    </div>
  );
};

export default RegistrationPage;
