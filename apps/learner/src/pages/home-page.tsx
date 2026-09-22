import AchievementSection from "@/components/achievementSection";
import HeroSection from "@/components/hero-section";
import InvestmentSecttion from "@/components/investment-secttion";
import OnboardingSection from "@/components/onboarding-section";
import TechStackSection from "@/components/techStack";
import TrackSection from "@/components/track-section";

const HomePage = () => {
  return (
    <>
      <HeroSection />
      <TrackSection />
      <TechStackSection />
      <AchievementSection />
      <div id="onboarding-section">
        <InvestmentSecttion />
      </div>
      <div id="onboarding-section">
        <OnboardingSection />
      </div>
    </>
  );
};

export default HomePage;
