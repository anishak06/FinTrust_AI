import React, { useEffect, useRef } from 'react';

export default function NetworkGlobe({ size = 500 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high density displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    const radius = size * 0.38;
    const center = size / 2;

    // Sphere dots (Fibonacci sphere algorithm for even distribution)
    const dotCount = 350;
    const dots = [];
    for (let i = 0; i < dotCount; i++) {
      const y = 1 - (i / (dotCount - 1)) * 2; // y goes from 1 to -1
      const radiusAtY = Math.sqrt(1 - y * y); // radius at y
      const goldenRatio = Math.PI * (3 - Math.sqrt(5));
      const theta = goldenRatio * i; // golden angle increment

      const x = Math.cos(theta) * radiusAtY;
      const z = Math.sin(theta) * radiusAtY;

      dots.push({ x, y, z });
    }

    // Active network hubs (representing financial institutions or nodes)
    const hubIndices = [15, 45, 95, 140, 190, 260, 310];
    const hubs = hubIndices.map(idx => dots[idx]);

    // Network connections (arcs) between hubs
    const connections = [
      { from: 0, to: 2, progress: 0, speed: 0.012, color: '#59CFFF' },
      { from: 1, to: 4, progress: 0.3, speed: 0.007, color: '#F5E6D3' },
      { from: 2, to: 5, progress: 0.6, speed: 0.010, color: '#59CFFF' },
      { from: 3, to: 6, progress: 0.1, speed: 0.009, color: '#59CFFF' },
      { from: 5, to: 1, progress: 0.7, speed: 0.006, color: '#F5E6D3' },
      { from: 4, to: 0, progress: 0.5, speed: 0.013, color: '#59CFFF' },
      { from: 6, to: 2, progress: 0.2, speed: 0.008, color: '#59CFFF' },
      { from: 1, to: 3, progress: 0.8, speed: 0.011, color: '#F5E6D3' },
      { from: 5, to: 0, progress: 0.4, speed: 0.007, color: '#59CFFF' },
      { from: 2, to: 4, progress: 0.9, speed: 0.010, color: '#59CFFF' }
    ];

    // Ambient floating particles
    const particleCount = 40;
    const particles = [];
    for (let i = 0; i < particleCount; i++) {
      const angle1 = Math.random() * Math.PI * 2;
      const angle2 = Math.random() * Math.PI;
      const dist = radius * (1.08 + Math.random() * 0.15); // float outside sphere
      particles.push({
        x: Math.cos(angle1) * Math.sin(angle2) * dist,
        y: Math.sin(angle1) * Math.sin(angle2) * dist,
        z: Math.cos(angle2) * dist,
        size: 0.8 + Math.random() * 1.5,
        speed: 0.002 + Math.random() * 0.004
      });
    }

    // Rotation angles
    let angleY = 0;
    let angleX = 0.2; // slight tilt

    // Mouse responsiveness and interactive flinging/inertia
    let targetAngleY = 0;
    let targetAngleX = 0.2;
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let dragVelocity = { x: 0, y: 0 };
    let userRotationY = 0;
    let userRotationX = 0.2;

    const handleMouseDown = (e) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
      dragVelocity = { x: 0, y: 0 };
    };

    const handleMouseMove = (e) => {
      if (isDragging) {
        const deltaX = e.clientX - previousMousePosition.x;
        const deltaY = e.clientY - previousMousePosition.y;
        
        userRotationY += deltaX * 0.005;
        userRotationX += deltaY * 0.005;
        
        // Clamp X rotation to prevent flipping upside down
        userRotationX = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, userRotationX));

        dragVelocity = {
          x: deltaX * 0.005,
          y: deltaY * 0.005
        };

        previousMousePosition = { x: e.clientX, y: e.clientY };
      } else {
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left - center;
        const my = e.clientY - rect.top - center;
        targetAngleY = (mx / size) * 0.4;
        targetAngleX = (my / size) * 0.4 + 0.2;
      }
    };

    const handleMouseUpOrLeave = () => {
      isDragging = false;
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUpOrLeave);
    canvas.addEventListener('mouseleave', handleMouseUpOrLeave);

    let animationFrameId;

    const render = () => {
      // Clear with soft alpha for a tiny trail effect
      ctx.clearRect(0, 0, size, size);

      if (isDragging) {
        angleY = userRotationY;
        angleX = userRotationX;
        // Keep targets aligned
        targetAngleY = angleY;
        targetAngleX = angleX;
      } else {
        // Decay velocity
        dragVelocity.x *= 0.95;
        dragVelocity.y *= 0.95;

        // Apply auto-rotation plus drag velocity inertia
        angleY += 0.0045 + dragVelocity.x;
        angleX += dragVelocity.y;

        // Smoothly blend in mouse hover coordinates
        angleY += (targetAngleY - angleY) * 0.03;
        angleX += (targetAngleX - angleX) * 0.03;

        userRotationY = angleY;
        userRotationX = angleX;
      }

      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);
      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);

      // Helper to project 3D point to 2D
      const project = (point) => {
        // Rotate Y
        let x1 = point.x * cosY - point.z * sinY;
        let z1 = point.x * sinY + point.z * cosY;

        // Rotate X
        let y2 = point.y * cosX - z1 * sinX;
        let z2 = point.y * sinX + z1 * cosX;

        // Perspective scaling
        const perspective = 300 / (300 + z2);
        
        return {
          x: center + x1 * perspective,
          y: center + y2 * perspective,
          z: z2, // keep for depth ordering
          scale: perspective
        };
      };

      // Check if light mode is active
      const isLightMode = document.documentElement.classList.contains('light');

      // Dynamic theme colors
      const globeGridColor = isLightMode ? 'rgba(16, 44, 87, 0.35)' : 'rgba(89, 207, 255, 0.12)';
      const globeRingColor = isLightMode ? 'rgba(16, 44, 87, 0.42)' : 'rgba(89, 207, 255, 0.15)';
      const dotColorPrefix = isLightMode ? 'rgba(16, 44, 87,' : 'rgba(89, 207, 255,';
      const connectionColor = isLightMode ? 'rgba(16, 44, 87, 0.65)' : 'rgba(89, 207, 255, 0.45)';
      const hubColor = isLightMode ? '#102C57' : '#59CFFF';
      const hubPulseColor = isLightMode ? 'rgba(16, 44, 87, 0.4)' : 'rgba(89, 207, 255, 0.3)';

      // 1. Draw Globe mesh lines (subtle grid outline behind)
      ctx.strokeStyle = globeGridColor;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.arc(center, center, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Draw longitudinal structural rings (projects authentic 3D wireframe mesh)
      const rings = 4;
      for (let r = 0; r < rings; r++) {
        const phi = (r / rings) * Math.PI;
        ctx.beginPath();
        ctx.strokeStyle = globeRingColor;
        ctx.lineWidth = 0.5;
        for (let theta = 0; theta <= Math.PI * 2 + 0.1; theta += 0.15) {
          const x = Math.cos(theta) * Math.sin(phi);
          const y = Math.sin(theta) * Math.sin(phi);
          const z = Math.cos(phi);
          
          const pt = project({ x: x * radius, y: y * radius, z: z * radius });
          
          if (theta === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.stroke();
      }

      // Project all dots
      const projectedDots = dots.map(dot => {
        const scaledDot = { x: dot.x * radius, y: dot.y * radius, z: dot.z * radius };
        return {
          original: dot,
          projected: project(scaledDot)
        };
      });

      // Project all floating particles
      const projectedParticles = particles.map(part => {
        // Slowly rotate ambient particles around sphere Y axis
        part.x = part.x * Math.cos(part.speed) - part.z * Math.sin(part.speed);
        part.z = part.x * Math.sin(part.speed) + part.z * Math.cos(part.speed);
        return project(part);
      });

      // Project hubs
      const projectedHubs = hubs.map(hub => {
        const scaledHub = { x: hub.x * radius, y: hub.y * radius, z: hub.z * radius };
        return project(scaledHub);
      });

      // Draw connections (arcs) between hubs
      connections.forEach(conn => {
        const p1 = projectedHubs[conn.from];
        const p2 = projectedHubs[conn.to];

        // Only draw if both are visible (or front facing mostly)
        if (p1.z < 80 && p2.z < 80) {
          ctx.beginPath();
          ctx.strokeStyle = connectionColor;
          ctx.lineWidth = 1.2;
          ctx.moveTo(p1.x, p1.y);
          
          // Calculate curved control point in 2D to simulate 3D arc
          const midX = (p1.x + p2.x) / 2;
          const midY = (p1.y + p2.y) / 2;
          const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
          
          // Control point pulled toward center or pushed out
          const dx = (p2.x - p1.x) / dist;
          const dy = (p2.y - p1.y) / dist;
          const cpX = midX - dy * (dist * 0.15);
          const cpY = midY + dx * (dist * 0.15);

          ctx.quadraticCurveTo(cpX, cpY, p2.x, p2.y);
          ctx.stroke();

          // Draw animated data packet traveling along arc
          conn.progress += conn.speed;
          if (conn.progress > 1) conn.progress = 0;

          // Quadratic bezier interpolation formula
          const t = conn.progress;
          const packetX = (1 - t) * (1 - t) * p1.x + 2 * (1 - t) * t * cpX + t * t * p2.x;
          const packetY = (1 - t) * (1 - t) * p1.y + 2 * (1 - t) * t * cpY + t * t * p2.y;

          // Glow particle
          ctx.beginPath();
          ctx.fillStyle = isLightMode ? '#102C57' : conn.color;
          ctx.shadowColor = isLightMode ? '#102C57' : conn.color;
          ctx.shadowBlur = isLightMode ? 4 : 15;
          ctx.arc(packetX, packetY, 2.8, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0; // reset
        }
      });

      // Draw all sphere dots
      projectedDots.forEach(({ projected }) => {
        // Fade dots on the back side
        const alpha = Math.max(0.18, Math.min(0.85, (radius - projected.z) / (radius * 1.3)));
        
        ctx.beginPath();
        // Highlight active hubs slightly
        ctx.fillStyle = `${dotColorPrefix}${alpha})`;
        const dotSize = projected.z < 0 ? 1.5 : 0.8;
        ctx.arc(projected.x, projected.y, dotSize, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw floating particles
      projectedParticles.forEach(part => {
        const alpha = Math.max(0.08, Math.min(0.5, (radius * 1.2 - part.z) / (radius * 2.4)));
        ctx.beginPath();
        ctx.fillStyle = isLightMode ? `rgba(16, 44, 87, ${alpha * 0.45})` : `rgba(245, 230, 211, ${alpha * 0.6})`;
        ctx.arc(part.x, part.y, 1.2, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw active financial hubs (glowing nodes)
      projectedHubs.forEach((hub, idx) => {
        if (hub.z < radius * 0.4) {
          const time = Date.now() * 0.0015;
          const pulseSize = 4 + Math.sin(time * 2.5 + idx) * 2;

          // Radar wave pulse expanding outwards
          const radarProgress = (time * 1.5 + idx * 0.3) % 1;
          ctx.beginPath();
          ctx.strokeStyle = isLightMode 
            ? `rgba(16, 44, 87, ${0.5 * (1 - radarProgress)})` 
            : `rgba(89, 207, 255, ${0.65 * (1 - radarProgress)})`;
          ctx.lineWidth = 0.8;
          ctx.arc(hub.x, hub.y, 4 + radarProgress * 14, 0, Math.PI * 2);
          ctx.stroke();

          // Outer glowing pulse
          ctx.beginPath();
          ctx.strokeStyle = hubPulseColor;
          ctx.lineWidth = 1;
          ctx.arc(hub.x, hub.y, pulseSize, 0, Math.PI * 2);
          ctx.stroke();

          // Inner solid dot
          ctx.beginPath();
          ctx.fillStyle = hubColor;
          ctx.shadowColor = hubColor;
          ctx.shadowBlur = isLightMode ? 6 : 15;
          ctx.arc(hub.x, hub.y, 2.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0; // reset
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUpOrLeave);
      canvas.removeEventListener('mouseleave', handleMouseUpOrLeave);
    };
  }, [size]);

  const isLightMode = typeof document !== 'undefined' ? document.documentElement.classList.contains('light') : false;

  return (
    <div className="relative flex items-center justify-center pointer-events-auto">
      {/* Glow highlight behind globe (Radial Gradient as requested) */}
      <div 
        className="absolute w-[85%] h-[85%] rounded-full pointer-events-none" 
        style={{
          background: isLightMode 
            ? 'radial-gradient(circle, rgba(16, 44, 87, 0.16) 0%, rgba(16, 44, 87, 0) 75%)' 
            : 'radial-gradient(circle, rgba(89, 207, 255, 0.28) 0%, rgba(89, 207, 255, 0) 70%)',
          filter: 'blur(45px)'
        }}
      />
      <canvas
        ref={canvasRef}
        className="relative z-10 cursor-grab active:cursor-grabbing select-none"
      />
    </div>
  );
}
