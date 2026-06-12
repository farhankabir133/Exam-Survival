// BPSC Competitive Exam Design Tokens: Ambient FX & Starry Layers

export const cosmicBackgroundFX = {
  softStargaze: {
    className: "absolute inset-0 opacity-20 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] animate-pulse"
  },
  cognitiveGrid: {
    className: "absolute inset-0 bg-[linear-gradient(to_right,rgba(30,41,59,0.15)_1px,transparent_1px),linear-gradient(to_bottom,rgba(30,41,59,0.15)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_80%,transparent_100%)]"
  },
  glowOrbs: [
    { className: "absolute top-[-10%] left-[-20%] w-[80%] h-[700px] bg-cyan-900/10 rounded-full blur-3xl" },
    { className: "absolute right-[-20%] top-[20%] w-[80%] h-[700px] bg-purple-900/10 rounded-full blur-3xl opacity-60" },
    { className: "absolute top-[40%] left-[30%] w-[40%] h-[500px] bg-emerald-900/5 rounded-full blur-3xl opacity-50" }
  ]
};

export const screenFlashVariants = {
  correct: "animate-flash-green",
  wrong: "animate-shake",
  break: "animate-break"
};
