import * as React from "react"
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ButtonProps } from "@/components/ui/button";
import { MousePointerClick } from "lucide-react";

interface Particle {
  id: number;
  x: number;
  y: number;
}

interface ParticleButtonProps extends ButtonProps {
  onSuccess?: () => void;
  successDuration?: number;
}

function SuccessParticles({
  particles,
  origin,
}: {
  particles: Particle[];
  origin: { x: number; y: number } | null;
}) {
  if (!origin) return null;

  return (
    <AnimatePresence>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="fixed w-1.5 h-1.5 bg-primary rounded-full pointer-events-none z-50"
          style={{ left: origin.x, top: origin.y }}
          initial={{
            scale: 0,
            x: 0,
            y: 0,
          }}
          animate={{
            scale: [0, 1, 0],
            x: p.x,
            y: p.y,
          }}
          transition={{
            duration: 0.6,
            delay: p.id * 0.08,
            ease: "easeOut",
          }}
        />
      ))}
    </AnimatePresence>
  );
}

function ParticleButton({
  children,
  onClick,
  onSuccess,
  successDuration = 1000,
  className,
  ...props
}: ParticleButtonProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [origin, setOrigin] = useState<{ x: number; y: number } | null>(null);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const generated: Particle[] = [
      { id: 0, x: -35, y: -45 },
      { id: 1, x: 35, y: -50 },
      { id: 2, x: -55, y: -25 },
      { id: 3, x: 50, y: -30 },
      { id: 4, x: -20, y: -60 },
      { id: 5, x: 25, y: -55 },
    ];

    setOrigin({ x: centerX, y: centerY });
    setParticles(generated);

    if (onClick) onClick(e);
    if (onSuccess) onSuccess();

    setTimeout(() => {
      setParticles([]);
      setOrigin(null);
    }, successDuration);
  };

  return (
    <>
      <SuccessParticles particles={particles} origin={origin} />
      <Button
        onClick={handleClick}
        className={cn(
          "relative",
          particles.length > 0 && "scale-95",
          "transition-transform duration-100",
          className
        )}
        {...props}
      >
        {children}
        <MousePointerClick className="h-4 w-4 ml-1.5" />
      </Button>
    </>
  );
}

export { ParticleButton }
