/**
 * Button design presets using only existing classes from globals.css:
 * animate-fade-in-up, animate-slide-in-left, animate-fade-in, animate-scale-in
 * hover-lift, hover-lift-md
 */

export type ButtonPresetVariant = "default" | "secondary" | "outline" | "ghost" | "link"

export interface ButtonPreset {
  id: string
  label: string
  variant: ButtonPresetVariant
  className: string
}

export const BUTTON_PRESETS: ButtonPreset[] = [
  {
    id: "primaryLiftFadeUp",
    label: "Primary Lift Fade Up",
    variant: "default",
    className:
      "hover-lift-md animate-fade-in-up focus-visible:ring-2 focus-visible:ring-primary/30 shadow-sm hover:shadow-lg active:shadow-md active:opacity-95",
  },
  {
    id: "outlineSweepSlideLeft",
    label: "Outline Sweep Slide Left",
    variant: "outline",
    className:
      "relative overflow-hidden animate-slide-in-left hover:border-primary/60 before:absolute before:inset-0 before:-translate-x-full before:bg-primary/10 before:transition-transform before:duration-300 before:ease-out hover:before:translate-x-0 focus-visible:ring-2 focus-visible:ring-primary/20",
  },
  {
    id: "ghostSoftFade",
    label: "Ghost Soft Fade",
    variant: "ghost",
    className:
      "animate-fade-in hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary/20 active:opacity-90",
  },
  {
    id: "pillScaleIn",
    label: "Pill Scale In",
    variant: "secondary",
    className:
      "rounded-full animate-scale-in hover-lift shadow-sm hover:shadow-lg focus-visible:ring-2 focus-visible:ring-primary/25",
  },
  // --- New visually enhanced button presets below ---
  {
    id: "glass-primary",
    label: "Glass Primary",
    variant: "default",
    className:
      "bg-primary/80 text-primary-foreground backdrop-blur-md border border-white/20 shadow-[0_4px_24px_-6px_rgba(0,0,0,0.25)] hover:bg-primary hover:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.35)] transition-all duration-300 ease-out",
  },
  {
    id: "gradient-lux",
    label: "Gradient Lux",
    variant: "default",
    className:
      "bg-gradient-to-r from-primary via-accent to-primary text-primary-foreground shadow-lg hover:brightness-110 hover:shadow-xl transition-all duration-300",
  },
  {
    id: "soft-elevated",
    label: "Soft Elevated",
    variant: "default",
    className:
      "bg-card text-foreground border border-border/40 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-6px_rgba(0,0,0,0.15)] transition-all duration-300",
  },
  {
    id: "glow-accent",
    label: "Glow Accent",
    variant: "default",
    className:
      "bg-primary text-primary-foreground shadow-[0_0_0_1px_var(--primary),0_8px_32px_-8px_rgba(0,0,0,0.3)] hover:shadow-[0_0_0_1px_var(--primary),0_16px_48px_-12px_rgba(0,0,0,0.4)] transition-all duration-300",
  },
  {
    id: "gradient-outline",
    label: "Gradient Outline",
    variant: "outline",
    className:
      "relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-medium text-heading rounded-base group bg-gradient-to-br from-cyan-500 to-blue-500 group-hover:from-cyan-500 group-hover:to-blue-500 hover:text-white dark:text-white focus:ring-4 focus:outline-none focus:ring-cyan-200 dark:focus:ring-cyan-800",
  },
  {
    id: "gradient-outline-vibrant",
    label: "Gradient Outline Vibrant",
    variant: "outline",
    className:
      "relative border-2 border-transparent bg-clip-padding bg-gradient-to-r from-primary via-primary to-accent p-px before:absolute before:inset-0 before:bg-background before:rounded-[calc(0.5rem-2px)] before:pointer-events-none hover:brightness-110 focus-visible:ring-2 focus-visible:ring-primary/40 active:scale-95 transition-all duration-300",
  },
  {
    id: "gradient-outline-soft",
    label: "Gradient Outline Soft",
    variant: "outline",
    className:
      "relative border-2 border-transparent bg-clip-padding bg-gradient-to-br from-primary/40 via-accent/40 to-primary/40 p-px before:absolute before:inset-0 before:bg-background before:rounded-[calc(0.5rem-2px)] before:pointer-events-none hover:from-primary/50 hover:via-accent/50 hover:to-primary/50 focus-visible:ring-2 focus-visible:ring-primary/25 transition-all duration-300",
  },
  {
    id: "gradient-border-purple-blue",
    label: "Gradient Border (Purple → Blue)",
    variant: "outline",
    className:
      "relative inline-flex items-center justify-center p-[2px] overflow-hidden rounded-xl bg-gradient-to-br from-purple-600 to-blue-500 " +
      "hover:shadow-lg focus-visible:ring-2 focus-visible:ring-primary/30 " +
      "[&>span]:bg-card [&>span]:px-6 [&>span]:py-2.5 [&>span]:rounded-[calc(theme(borderRadius.xl)-2px)] " +
      "group-hover:[&>span]:bg-transparent group-hover:text-white transition-all duration-300",
  },
  {
    id: "gradient-border-cyan-blue",
    label: "Gradient Border (Cyan → Blue)",
    variant: "outline",
    className:
      "relative inline-flex items-center justify-center p-[2px] overflow-hidden rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 " +
      "hover:shadow-lg focus-visible:ring-2 focus-visible:ring-primary/30 " +
      "[&>span]:bg-card [&>span]:px-6 [&>span]:py-2.5 [&>span]:rounded-[calc(theme(borderRadius.xl)-2px)] " +
      "group-hover:[&>span]:bg-transparent group-hover:text-white transition-all duration-300",
  },
  {
    id: "gradient-solid-purple-pink",
    label: "Gradient Solid (Purple → Pink)",
    variant: "default",
    className:
      "bg-gradient-to-br from-purple-500 to-pink-500 text-white " +
      "hover:brightness-110 hover:-translate-y-0.5 transition-all duration-300 " +
      "shadow-md hover:shadow-xl rounded-xl",
  },
  {
    id: "gradient-solid-green-blue",
    label: "Gradient Solid (Green → Blue)",
    variant: "default",
    className:
      "bg-gradient-to-br from-green-400 to-blue-600 text-white " +
      "hover:brightness-110 hover:-translate-y-0.5 transition-all duration-300 " +
      "shadow-md hover:shadow-xl rounded-xl",
  },
  
]

const presetById = new Map(BUTTON_PRESETS.map((p) => [p.id, p]))

/**
 * Stable list of available preset options for dropdowns and inspectors.
 * Includes all presets from BUTTON_PRESETS for easy dropdown rendering.
 */
export const BUTTON_PRESET_OPTIONS = [
  { value: "default", label: "Default (None)" },
  { value: "primaryLiftFadeUp", label: "Primary Lift Fade Up" },
  { value: "outlineSweepSlideLeft", label: "Outline Sweep Slide Left" },
  { value: "ghostSoftFade", label: "Ghost Soft Fade" },
  { value: "pillScaleIn", label: "Pill Scale In" },
  { value: "glass-primary", label: "Glass Primary" },
  { value: "gradient-lux", label: "Gradient Lux" },
  { value: "soft-elevated", label: "Soft Elevated" },
  { value: "glow-accent", label: "Glow Accent" },
  { value: "gradient-outline", label: "Gradient Outline" },
  { value: "gradient-outline-vibrant", label: "Gradient Outline Vibrant" },
  { value: "gradient-outline-soft", label: "Gradient Outline Soft" },
  { value: "gradient-border-purple-blue", label: "Gradient Border (Purple → Blue)" },
  { value: "gradient-border-cyan-blue", label: "Gradient Border (Cyan → Blue)" },
  { value: "gradient-solid-purple-pink", label: "Gradient Solid (Purple → Pink)" },
  { value: "gradient-solid-green-blue", label: "Gradient Solid (Green → Blue)" },
] as const

export type ButtonPresetOption = (typeof BUTTON_PRESET_OPTIONS)[number]

export function getButtonPreset(presetId: string | undefined): ButtonPreset | undefined {
  if (!presetId || presetId === "default") return undefined
  return presetById.get(presetId)
}

/**
 * Resolve variant and className for a button: per-button overrides take precedence over preset.
 * Gracefully falls back to "default" behavior for unknown preset values.
 */
export function resolveButtonPresetStyles(
  presetId: string | undefined,
  buttonVariant?: ButtonPresetVariant,
  buttonClassName?: string
): { variant: ButtonPresetVariant; className: string } {
  // Validate that presetId exists in our preset list if provided
  const validPresetId = presetId && presetId !== "default" && presetById.has(presetId) ? presetId : undefined
  
  const preset = validPresetId ? getButtonPreset(validPresetId) : undefined
  const variant = (buttonVariant ?? preset?.variant ?? "default") as ButtonPresetVariant
  const presetClass = preset?.className ?? ""
  const className = [presetClass, buttonClassName].filter(Boolean).join(" ")
  return { variant, className }
}
