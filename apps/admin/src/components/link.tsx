import { Link } from "react-router";

export interface NavigateLinkProps {
  href: string;
  text: string;
  page: string;
}
export const NavigateLink: React.FC<NavigateLinkProps> = ({
  href,
  text,
  page,
}) => {
  return (
    <Link to={href} className="text-center">
      <p className="text-gray-600">
        {text} <span className="text-[#4D94CE] font-bold">{page}</span>
      </p>
    </Link>
  );
};
