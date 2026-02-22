import type { BrandKey } from "@/types/navigation"

export interface NavTheme {
  wrapper: string
  wrapperScrolled: string
  shadow: string
  shadowScrolled: string
  link: { base: string; hover: string; active: string }
  focus: string
  iconButton: { base: string; hover: string }
  cta: { default: string; hover: string }
  mobile: {
    container: string
    link: { base: string; hover: string; active: string }
  }
  border: string
  indicator: string
}

const physiotherapyTheme: NavTheme = {
  wrapper: "bg-background/80 backdrop-blur-md border-b border-border/50",
  wrapperScrolled: "bg-background/95 backdrop-blur-xl shadow-lg shadow-primary/5",
  shadow: "shadow-sm",
  shadowScrolled: "shadow-lg shadow-primary/8",
  link: {
    base: "text-muted-foreground",
    hover: "hover:text-foreground",
    active: "text-primary font-semibold",
  },
  focus: "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
  iconButton: {
    base: "text-muted-foreground",
    hover: "hover:text-foreground hover:bg-muted",
  },
  cta: {
    default: "bg-primary text-primary-foreground",
    hover: "hover:bg-primary/90",
  },
  mobile: {
    container: "bg-background",
    link: {
      base: "text-foreground",
      hover: "hover:bg-muted",
      active: "bg-primary/10 text-primary font-semibold",
    },
  },
  border: "border-border",
  indicator: "bg-primary",
}

const physioKonzeptTheme: NavTheme = {
  wrapper: "bg-background/80 backdrop-blur-md border-b border-border/50",
  wrapperScrolled: "bg-background/95 backdrop-blur-xl shadow-lg shadow-accent/10",
  shadow: "shadow-sm",
  shadowScrolled: "shadow-lg shadow-accent/8",
  link: {
    base: "text-muted-foreground",
    hover: "hover:text-foreground",
    active: "text-accent font-semibold",
  },
  focus: "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
  iconButton: {
    base: "text-muted-foreground",
    hover: "hover:text-foreground hover:bg-muted",
  },
  cta: {
    default: "bg-accent text-accent-foreground",
    hover: "hover:bg-accent/90",
  },
  mobile: {
    container: "bg-background",
    link: {
      base: "text-foreground",
      hover: "hover:bg-muted",
      active: "bg-accent/10 text-accent font-semibold",
    },
  },
  border: "border-border",
  indicator: "bg-accent",
}

export function getNavTheme(brand: BrandKey): NavTheme {
  switch (brand) {
    case "physio-konzept":
      return physioKonzeptTheme
    default:
      return physiotherapyTheme
  }
}
