import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background mesh-gradient-bg">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <h1 className="text-7xl font-extrabold font-display aion-gradient-text mb-4">404</h1>
        <p className="text-lg text-muted-foreground font-light mb-8">This page doesn't exist</p>
        <a href="/" className="aion-glow-button inline-flex items-center gap-2 text-sm px-6 py-3">
          <Home className="h-4 w-4" />
          Return Home
        </a>
      </motion.div>
    </div>
  );
};

export default NotFound;
