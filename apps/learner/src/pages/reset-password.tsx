import { ResetPasswordForm } from "@/components/reset-password-form";
import { useParams } from "react-router";

const ResetPassword = () => {
  const params = useParams();
  const userId = params.id;

  return <ResetPasswordForm userId={userId} />;
};

export default ResetPassword;
