import React, { useEffect, useRef } from 'react';

export default function PremiumBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Grid details
    const gridSize = 60;

    // Slow drifting ambient particles
    const particleCount = 25;
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.15,
      radius: 1 + Math.random() * 2,
      opacity: 0.1 + Math.random() * 0.3
    }));

    let animationFrameId;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Check if light mode is active
      const isLightMode = document.documentElement.classList.contains('light');

      // 1. Draw subtle financial grid ledger pattern
      ctx.strokeStyle = isLightMode ? 'rgba(16, 44, 87, 0.035)' : 'rgba(255, 255, 255, 0.015)';
      ctx.lineWidth = 1;
      
      // Vertical lines
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Horizontal lines
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 2. Update and draw drifting ambient particles
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around boundaries
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.fillStyle = isLightMode 
          ? `rgba(16, 44, 87, ${p.opacity * 0.45})` 
          : `rgba(89, 207, 255, ${p.opacity})`;
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const isLightMode = typeof document !== 'undefined' ? document.documentElement.classList.contains('light') : false;

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
      {/* 3D Mesh glowing spheres */}
      <div className="absolute top-[5%] left-[10%] w-[45vw] h-[45vw] rounded-full bg-[#05142B] opacity-25 blur-[130px] animate-mesh-1" />
      <div className="absolute bottom-[10%] right-[5%] w-[40vw] h-[40vw] rounded-full bg-[#0A234A] opacity-20 blur-[140px] animate-mesh-2" />
      <div className="absolute top-[40%] left-[50%] w-[35vw] h-[35vw] rounded-full bg-[#01050F] opacity-40 blur-[120px] animate-mesh-3" />

      {/* Grid Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Elegant flowing curved background vector paths */}
      <svg className={`absolute inset-0 w-full h-full ${isLightMode ? 'opacity-[0.06]' : 'opacity-[0.03]'}`} xmlns="http://www.w3.org/2000/svg">
        <path
          d="M -100,200 Q 300,450 700,100 T 1500,600"
          fill="none"
          stroke={isLightMode ? "#102C57" : "#59CFFF"}
          strokeWidth="2.5"
          className="animate-pulse"
          style={{ animationDuration: '8s' }}
        />
        <path
          d="M -50,600 Q 500,200 900,700 T 1800,250"
          fill="none"
          stroke={isLightMode ? "#163D78" : "#F5E6D3"}
          strokeWidth="1.5"
          className="animate-pulse"
          style={{ animationDuration: '12s' }}
        />
      </svg>
    </div>
  );
}
