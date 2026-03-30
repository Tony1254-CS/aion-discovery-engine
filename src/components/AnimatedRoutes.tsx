import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import LandingPage from "@/pages/LandingPage";
import Dashboard from "@/pages/Dashboard";
import PaperView from "@/pages/PaperView";
import Leaderboard from "@/pages/Leaderboard";
import IdeaReviewResults from "@/pages/IdeaReviewResults";
import About from "@/pages/About";
import NotFound from "@/pages/NotFound";

const pageVariants = {
  initial: { opacity: 0, y: 12, scale: 0.99 },
  enter: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: [0.25, 0.4, 0, 1] } },
  exit: { opacity: 0, y: -8, scale: 0.995, transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } },
};

export default function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="enter"
        exit="exit"
        className="min-h-screen"
      >
        <Routes location={location}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/idea-review" element={<IdeaReviewResults />} />
          <Route path="/paper" element={<PaperView />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}
