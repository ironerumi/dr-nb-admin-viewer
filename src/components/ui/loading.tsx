import React from "react";

export const MorphingSquare: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-4 border-primary rounded-lg animate-spin" 
             style={{
               animation: "morphing 2s ease-in-out infinite"
             }}>
        </div>
        <style>{`
          @keyframes morphing {
            0%, 100% {
              border-radius: 0.5rem;
              transform: rotate(0deg);
            }
            25% {
              border-radius: 50%;
              transform: rotate(90deg);
            }
            50% {
              border-radius: 0.5rem;
              transform: rotate(180deg);
            }
            75% {
              border-radius: 50%;
              transform: rotate(270deg);
            }
          }
        `}</style>
      </div>
    </div>
  );
};
