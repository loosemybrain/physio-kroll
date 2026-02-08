export type BrandKey = "physiotherapy" | "physio-konzept";

export type HeroDecorationAsset = {
  wrapperClassName: string;
  glows: Array<{ className: string }>;
};

export type BrandAssets = {
  heroDecoration: HeroDecorationAsset;
  // (optional future) logos, imagery, patterns, etc.
  // logo?: { src: string; alt: string };
};

export const brandAssets: Record<BrandKey, BrandAssets> = {
  physiotherapy: {
    heroDecoration: {
      wrapperClassName: "hero-decoration-calm absolute inset-0 opacity-30",
      glows: [
        {
          className:
            "absolute right-0 top-0 h-[600px] w-[600px] rounded-full bg-hero-accent/10 blur-3xl animate-pulse-slow animate-delay-200",
        },
        {
          className:
            "absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-hero-highlight blur-2xl animate-float animate-delay-400",
        },
      ],
    },
  },
  "physio-konzept": {
    heroDecoration: {
      wrapperClassName: "hero-decoration-energetic absolute inset-0",
      glows: [
        {
          className:
            "absolute -right-20 top-20 h-[500px] w-[500px] rounded-full bg-hero-accent/20 blur-3xl animate-pulse-slow animate-delay-100",
        },
        {
          className:
            "absolute bottom-1/4 left-1 h-[500px] w-[500px] rounded-full bg-hero-accent/10 blur-2xl animate-float animate-delay-300",
        },
      ],
    },
  },
};
