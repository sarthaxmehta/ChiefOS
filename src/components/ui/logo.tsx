export function ChiefLogo({ className = "" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 100 120" 
      fill="currentColor" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Top Diamond */}
      <polygon points="50,5 60,20 50,35 40,20" />
      {/* Middle Chevron */}
      <polygon points="50,45 30,25 25,32 50,55 75,32 70,25" />
      {/* M-Shield Base */}
      <path d="M 15,35 
               C 15,35 15,75 15,85 
               C 15,100 50,115 50,115 
               C 50,115 85,100 85,85 
               C 85,75 85,35 85,35 
               L 65,45 
               L 65,80 
               L 55,60 
               L 50,70 
               L 45,60 
               L 35,80 
               L 35,45 Z" />
    </svg>
  );
}
