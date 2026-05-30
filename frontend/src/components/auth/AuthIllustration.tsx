export function AuthIllustration() {
  return (
    <div className="relative w-full h-full min-h-[500px] overflow-hidden rounded-r-3xl bg-gradient-to-br from-[#4a0080] via-[#6b00a8] to-[#3a0060]">
      {/* Layered diagonal capsule shapes matching the design */}

      {/* Large background capsule */}
      <div
        className="absolute w-[420px] h-[700px] rounded-full bg-gradient-to-b from-[#5a0098] to-[#2d004d] opacity-70"
        style={{ top: '-80px', right: '-80px', transform: 'rotate(-40deg)' }}
      />

      {/* Medium capsule overlay */}
      <div
        className="absolute w-[320px] h-[600px] rounded-full bg-gradient-to-b from-[#7200ba] to-[#3e0068] opacity-60"
        style={{ top: '40px', right: '-20px', transform: 'rotate(-40deg)' }}
      />

      {/* Bright accent capsule */}
      <div
        className="absolute w-[260px] h-[500px] rounded-full bg-gradient-to-b from-[#8c00e0] to-[#4a0080] opacity-50"
        style={{ top: '120px', right: '30px', transform: 'rotate(-40deg)' }}
      />

      {/* Small foreground accent circle */}
      <div
        className="absolute w-[180px] h-[180px] rounded-full bg-[#6a00b0]/30"
        style={{ bottom: '60px', left: '40px' }}
      />

      {/* Tiny decorative circle */}
      <div
        className="absolute w-[100px] h-[100px] rounded-full bg-[#9000e8]/20"
        style={{ top: '50%', left: '20%' }}
      />

      {/* Ambient glow */}
      <div
        className="absolute w-[300px] h-[300px] rounded-full bg-[#7b00c8]/15 blur-3xl"
        style={{ top: '30%', right: '10%' }}
      />
    </div>
  )
}
