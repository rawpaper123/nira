"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import HowItWorks from "@/components/HowItWorks";
import RealDatesSection from "@/components/RealDatesSection";
import MatchmakerSection from "@/components/MatchmakerSection";
import GallerySection from "@/components/GallerySection";
import ComparisonSection from "@/components/ComparisonSection";
import SafetySection from "@/components/SafetySection";
import FAQSection from "@/components/FAQSection";
import Footer from "@/components/Footer";
import JoinModal from "@/components/JoinModal";

export default function Home() {
  const [showJoinModal, setShowJoinModal] = useState(false);

  return (
    <>
      <Navbar onJoinClick={() => setShowJoinModal(true)} />

      <main>
        <HeroSection onJoinClick={() => setShowJoinModal(true)} />
        <HowItWorks />
        <RealDatesSection />
        <MatchmakerSection />
        <GallerySection />
        <ComparisonSection />
        <SafetySection />
        <FAQSection />
      </main>

      <Footer />

      <JoinModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
      />
    </>
  );
}
