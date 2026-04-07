import React, { useEffect, useRef } from "react";

interface CrystalCursorProps {
  title?: string;
  subtitle?: string;
  caption?: string;
  crystalColor?: string;
  shatterColor?: string;
  titleSize?: string;
  subtitleSize?: string;
  captionSize?: string;
  className?: string;
  /** When true, renders only the canvas (no text overlay) so it can be used as a background layer */
  backgroundOnly?: boolean;
  children?: React.ReactNode;
}

const CrystalCursor: React.FC<CrystalCursorProps> = ({
  title = "Crystalline Echo",
  subtitle = "Fractured light in the void",
  caption = "Click to shatter the silence",
  titleSize = "text-5xl md:text-7xl lg:text-8xl",
  subtitleSize = "text-xl md:text-2xl",
  captionSize = "text-sm md:text-base",
  className = "",
  backgroundOnly = false,
  children,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);
  const mouse = useRef({ x: typeof window !== 'undefined' ? window.innerWidth / 2 : 0, y: typeof window !== 'undefined' ? window.innerHeight / 2 : 0 });
  const crystalsRef = useRef<Crystal[]>([]);
  const shardsRef = useRef<Shard[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const animate = () => {
      ctx.fillStyle = "rgba(6, 12, 16, 0.1)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (Math.random() > 0.7) {
        crystalsRef.current.push(
          new Crystal(
            mouse.current.x + (Math.random() - 0.5) * 50,
            mouse.current.y + (Math.random() - 0.5) * 50,
            ctx
          )
        );
      }

      crystalsRef.current = crystalsRef.current.filter((c) => c.life > 0);
      crystalsRef.current.forEach((c) => {
        c.update();
        c.draw();
      });

      shardsRef.current = shardsRef.current.filter((s) => s.life > 0);
      shardsRef.current.forEach((s) => {
        s.update();
        s.draw();
      });

      animationFrameId.current = requestAnimationFrame(animate);
    };

    animate();

    const handleMouseMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    };

    const handleClick = (e: MouseEvent) => {
      for (let i = 0; i < 50; i++) {
        shardsRef.current.push(new Shard(e.clientX, e.clientY, ctx));
      }
    };

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("resize", handleResize);
    window.addEventListener("click", handleClick);

    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("click", handleClick);
    };
  }, []);

  if (backgroundOnly) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <canvas ref={canvasRef} className="fixed inset-0 block h-full w-full pointer-events-none" style={{ zIndex: 0 }} />
        <div className="relative z-10">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative h-screen w-screen overflow-hidden bg-[#060c10] font-sans ${className}`}>
      <canvas ref={canvasRef} className="fixed inset-0 block h-full w-full" />
      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center gap-2 select-none text-center p-4">
        <h1
          className={`m-0 p-0 text-white font-light uppercase tracking-[0.1em] leading-none ${titleSize}`}
          style={{
            textShadow:
              "0 0 10px rgba(173, 216, 230, 0.7), 0 0 20px rgba(173, 216, 230, 0.5)",
          }}
        >
          {title}
        </h1>
        <h2
          className={`m-0 p-0 text-gray-300 font-extralight italic leading-none ${subtitleSize}`}
          style={{ textShadow: "0 0 5px rgba(173, 216, 230, 0.5)" }}
        >
          {subtitle}
        </h2>
        <p className={`mt-4 p-0 text-gray-400 font-extralight leading-none ${captionSize}`}>
          {caption}
        </p>
      </div>
    </div>
  );
};

export default CrystalCursor;

// ---- Internal classes ----

class Crystal {
  x: number;
  y: number;
  angle: number;
  radius: number;
  targetRadius: number;
  life: number;
  context: CanvasRenderingContext2D;
  lineWidth: number;
  turnAngle: number;

  constructor(x: number, y: number, context: CanvasRenderingContext2D) {
    this.x = x;
    this.y = y;
    this.angle = Math.random() * Math.PI * 2;
    this.radius = 0;
    this.targetRadius = Math.random() * 80 + 20;
    this.life = 150;
    this.context = context;
    this.lineWidth = Math.random() * 1.5 + 0.5;
    this.turnAngle = (Math.random() - 0.5) * 0.1;
  }

  draw() {
    this.context.strokeStyle = `hsla(0, 85%, 60%, ${this.life / 150})`;
    this.context.lineWidth = this.lineWidth;
    this.context.beginPath();
    this.context.moveTo(this.x, this.y);
    const endX = this.x + Math.cos(this.angle) * this.radius;
    const endY = this.y + Math.sin(this.angle) * this.radius;
    this.context.lineTo(endX, endY);
    this.context.stroke();
  }

  update() {
    if (this.radius < this.targetRadius) {
      this.radius += 0.5;
    }
    this.life -= 1;
    this.angle += this.turnAngle;
  }
}

class Shard {
  x: number;
  y: number;
  angle: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
  context: CanvasRenderingContext2D;

  constructor(x: number, y: number, context: CanvasRenderingContext2D) {
    this.x = x;
    this.y = y;
    this.angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 5 + 2;
    this.vx = Math.cos(this.angle) * speed;
    this.vy = Math.sin(this.angle) * speed;
    this.life = 100;
    this.size = Math.random() * 3 + 1;
    this.context = context;
  }

  draw() {
    this.context.fillStyle = `hsla(0, 90%, 70%, ${this.life / 100})`;
    this.context.beginPath();
    this.context.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    this.context.fill();
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life -= 1;
  }
}
