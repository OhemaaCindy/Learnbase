import { Outlet } from "react-router";
import Navbar from "../../components/navbar";
import Footer from "../../components/footer";

const PageLayout = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <div className="flex-1">
        <Outlet />
      </div>
      <div className="mt-auto">
        <Footer />
      </div>
    </div>
  );
};

export default PageLayout;
