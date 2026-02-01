"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { CheckCircle2, AlertCircle, Loader2, Send, Mail, Phone, MapPin, Clock } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

// Schema - DO NOT MODIFY
const contactFormSchema = z.object({
  name: z.string().min(2, "Name muss mindestens 2 Zeichen haben"),
  email: z.string().email("Bitte geben Sie eine gültige E-Mail-Adresse ein"),
  phone: z.string().optional(),
  subject: z.string().min(3, "Betreff muss mindestens 3 Zeichen haben"),
  message: z.string().min(10, "Nachricht muss mindestens 10 Zeichen haben"),
  honeypot: z.string().max(0), // Spam protection
})

type ContactFormData = z.infer<typeof contactFormSchema>

// Props - DO NOT MODIFY
interface ContactFormBlockProps {
  layout?: "stacked" | "split"
  headline?: string
  introText?: string
  submitLabel?: string
  successMessage?: string
  errorMessage?: string
  onSubmit?: (data: ContactFormData) => Promise<void>
  className?: string
}

// Floating label input component for premium feel
function FloatingLabelInput({
  id,
  label,
  type = "text",
  required,
  error,
  errorId,
  ...props
}: {
  id: string
  label: string
  type?: string
  required?: boolean
  error?: string
  errorId?: string
} & React.ComponentProps<typeof Input>) {
  const [isFocused, setIsFocused] = React.useState(false)
  const [hasValue, setHasValue] = React.useState(false)

  return (
    <div className="group relative">
      <Input
        id={id}
        type={type}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          "peer h-14 rounded-xl border-border/50 bg-background/50 px-4 pt-5 pb-2 text-base backdrop-blur-sm",
          "transition-all duration-300 ease-out",
          "placeholder:text-transparent",
          "hover:border-border hover:bg-background/80",
          "focus-visible:border-primary focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-primary/20",
          error && "border-destructive/50 hover:border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20"
        )}
        onFocus={() => setIsFocused(true)}
        onBlur={(e) => {
          setIsFocused(false)
          setHasValue(e.target.value.length > 0)
        }}
        onChange={(e) => setHasValue(e.target.value.length > 0)}
        {...props}
      />
      <Label
        htmlFor={id}
        className={cn(
          "pointer-events-none absolute left-4 text-muted-foreground",
          "transition-all duration-200 ease-out",
          isFocused || hasValue
            ? "top-2 text-xs font-medium"
            : "top-1/2 -translate-y-1/2 text-base",
          isFocused && "text-primary",
          error && isFocused && "text-destructive"
        )}
      >
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </Label>
      {error && (
        <p id={errorId} className="mt-2 text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

// Floating label textarea component
function FloatingLabelTextarea({
  id,
  label,
  required,
  error,
  errorId,
  ...props
}: {
  id: string
  label: string
  required?: boolean
  error?: string
  errorId?: string
} & React.ComponentProps<typeof Textarea>) {
  const [isFocused, setIsFocused] = React.useState(false)
  const [hasValue, setHasValue] = React.useState(false)

  return (
    <div className="group relative">
      <Textarea
        id={id}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          "peer min-h-[160px] resize-none rounded-xl border-border/50 bg-background/50 px-4 pt-8 pb-3 text-base backdrop-blur-sm",
          "transition-all duration-300 ease-out",
          "placeholder:text-transparent",
          "hover:border-border hover:bg-background/80",
          "focus-visible:border-primary focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-primary/20",
          error && "border-destructive/50 hover:border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20"
        )}
        onFocus={() => setIsFocused(true)}
        onBlur={(e) => {
          setIsFocused(false)
          setHasValue(e.target.value.length > 0)
        }}
        onChange={(e) => setHasValue(e.target.value.length > 0)}
        {...props}
      />
      <Label
        htmlFor={id}
        className={cn(
          "pointer-events-none absolute left-4 text-muted-foreground",
          "transition-all duration-200 ease-out",
          isFocused || hasValue
            ? "top-3 text-xs font-medium"
            : "top-6 text-base",
          isFocused && "text-primary",
          error && isFocused && "text-destructive"
        )}
      >
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </Label>
      {error && (
        <p id={errorId} className="mt-2 text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

export function ContactFormBlock({
  layout = "stacked",
  headline = "Kontaktieren Sie uns",
  introText = "Wir freuen uns auf Ihre Nachricht. Füllen Sie das Formular aus und wir melden uns schnellstmöglich bei Ihnen.",
  submitLabel = "Nachricht senden",
  successMessage = "Vielen Dank für Ihre Nachricht! Wir werden uns zeitnah bei Ihnen melden.",
  errorMessage = "Es ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.",
  onSubmit,
  className,
}: ContactFormBlockProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [submitStatus, setSubmitStatus] = React.useState<"idle" | "success" | "error">("idle")

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
      honeypot: "",
    },
  })

  // Submit logic - DO NOT MODIFY
  const handleFormSubmit = async (data: ContactFormData) => {
    if (data.honeypot) return // Spam protection

    setIsSubmitting(true)
    setSubmitStatus("idle")

    try {
      if (onSubmit) {
        await onSubmit(data)
      } else {
        // Default behavior - simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1500))
      }
      setSubmitStatus("success")
      reset()
    } catch {
      setSubmitStatus("error")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Premium Form fields with floating labels
  const FormFields = () => (
    <div className="space-y-6">
      {/* Two column grid for name and email */}
      <div className="grid gap-6 sm:grid-cols-2">
        <FloatingLabelInput
          id="name"
          label="Name"
          type="text"
          required
          error={errors.name?.message}
          errorId="name-error"
          {...register("name")}
        />
        <FloatingLabelInput
          id="email"
          label="E-Mail"
          type="email"
          required
          error={errors.email?.message}
          errorId="email-error"
          {...register("email")}
        />
      </div>

      {/* Two column grid for phone and subject */}
      <div className="grid gap-6 sm:grid-cols-2">
        <FloatingLabelInput
          id="phone"
          label="Telefon (optional)"
          type="tel"
          {...register("phone")}
        />
        <FloatingLabelInput
          id="subject"
          label="Betreff"
          type="text"
          required
          error={errors.subject?.message}
          errorId="subject-error"
          {...register("subject")}
        />
      </div>

      {/* Full width message */}
      <FloatingLabelTextarea
        id="message"
        label="Nachricht"
        required
        error={errors.message?.message}
        errorId="message-error"
        {...register("message")}
      />

      {/* Honeypot - Hidden spam protection */}
      <div className="sr-only" aria-hidden="true">
        <Label htmlFor="honeypot">Dieses Feld nicht ausfüllen</Label>
        <Input
          id="honeypot"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          {...register("honeypot")}
        />
      </div>

      {/* Premium Submit Button with glow effect */}
      <div className="pt-4">
        <Button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            "group relative h-14 w-full overflow-hidden rounded-xl text-base font-semibold",
            "bg-primary text-primary-foreground",
            "transition-all duration-400 ease-out",
            "hover:-translate-y-0.5",
            "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            "disabled:opacity-70 disabled:hover:translate-y-0",
            "before:absolute before:inset-0 before:-z-10 before:bg-primary/80 before:opacity-0 before:blur-xl before:transition-opacity before:duration-400",
            "hover:before:opacity-100"
          )}
        >
          {/* Shimmer effect */}
          <span className="absolute inset-0 -z-10 bg-[linear-gradient(110deg,transparent_25%,rgba(255,255,255,0.15)_50%,transparent_75%)] bg-[length:200%_100%] opacity-0 transition-opacity duration-500 group-hover:animate-shimmer group-hover:opacity-100" />
          
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-3">
              <Loader2 className="size-5 animate-spin" />
              <span>Wird gesendet...</span>
            </span>
          ) : (
            <span className="flex items-center justify-center gap-3">
              <span>{submitLabel}</span>
              <Send className="size-4 transition-transform duration-300 ease-out group-hover:translate-x-1" />
            </span>
          )}
        </Button>
      </div>
    </div>
  )

  // Premium Success State with animation
  if (submitStatus === "success") {
    return (
      <section className={cn("relative w-full overflow-hidden", className)}>
        {/* Decorative background blur */}
        <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
          <div className="absolute left-1/4 top-1/4 size-64 rounded-full bg-green-500/10 blur-3xl" />
        </div>
        
        <div className="mx-auto max-w-xl">
          <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-3xl border border-border/30 bg-card/60 px-8 py-20 text-center shadow-xl backdrop-blur-md">
            {/* Animated checkmark container */}
            <div className="relative mb-8">
              <div className="absolute inset-0 animate-ping rounded-full bg-green-500/20" />
              <div className="relative flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-green-400/20 to-green-600/20 ring-1 ring-green-500/30">
                <CheckCircle2 className="size-10 text-green-500" />
              </div>
            </div>
            
            <h3 className="mb-4 text-2xl font-semibold tracking-tight text-foreground">
              Nachricht gesendet
            </h3>
            <p className="max-w-sm leading-relaxed text-muted-foreground">
              {successMessage}
            </p>
            <Button
              variant="outline"
              onClick={() => setSubmitStatus("idle")}
              className="mt-10 rounded-xl px-6 transition-all duration-300 hover:-translate-y-0.5 hover:bg-background hover:shadow-lg"
            >
              Weitere Nachricht senden
            </Button>
          </div>
        </div>
      </section>
    )
  }

  // Premium Split Layout with contact info cards
  if (layout === "split") {
    return (
      <section className={cn("relative w-full overflow-hidden", className)}>
        {/* Decorative background elements */}
        <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
          <div className="absolute -left-32 top-1/4 size-96 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -right-32 bottom-1/4 size-80 rounded-full bg-primary/5 blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-5 lg:gap-16">
            {/* Left Side - Content (2 columns) */}
            <div className="flex flex-col justify-center lg:col-span-2">
              <span className="mb-4 inline-flex w-fit items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-primary">
                <Mail className="size-3.5" />
                Kontakt
              </span>
              
              <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl">
                {headline}
              </h2>
              <p className="mt-6 max-w-md text-pretty leading-relaxed text-muted-foreground lg:text-lg lg:leading-8">
                {introText}
              </p>
              
              {/* Contact Info Cards */}
              <div className="mt-12 space-y-4">
                <div className="group flex items-center gap-4 rounded-xl border border-border/30 bg-card/40 p-4 backdrop-blur-sm transition-all duration-300 hover:border-border/60 hover:bg-card/60">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                    <Clock className="size-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Schnelle Antwort</p>
                    <p className="text-sm text-muted-foreground">Innerhalb von 24 Stunden</p>
                  </div>
                </div>
                
                <div className="group flex items-center gap-4 rounded-xl border border-border/30 bg-card/40 p-4 backdrop-blur-sm transition-all duration-300 hover:border-border/60 hover:bg-card/60">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                    <Phone className="size-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Kostenlose Beratung</p>
                    <p className="text-sm text-muted-foreground">Unverbindliches Erstgespräch</p>
                  </div>
                </div>
                
                <div className="group flex items-center gap-4 rounded-xl border border-border/30 bg-card/40 p-4 backdrop-blur-sm transition-all duration-300 hover:border-border/60 hover:bg-card/60">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                    <MapPin className="size-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Lokale Betreuung</p>
                    <p className="text-sm text-muted-foreground">Persönlich vor Ort für Sie da</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Form Card (3 columns) */}
            <div className="relative lg:col-span-3">
              {/* Card glow effect */}
              <div className="pointer-events-none absolute -inset-px rounded-[28px] bg-gradient-to-b from-primary/20 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              
              <div className="relative rounded-3xl border border-border/40 bg-card/70 p-8 shadow-2xl shadow-primary/5 backdrop-blur-md lg:p-12">
                {/* Error Alert */}
                {submitStatus === "error" && (
                  <div className="mb-8 flex items-start gap-4 rounded-xl border border-destructive/20 bg-destructive/5 p-5">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
                      <AlertCircle className="size-5 text-destructive" />
                    </div>
                    <div>
                      <p className="font-medium text-destructive">Fehler beim Senden</p>
                      <p className="mt-1 text-sm leading-relaxed text-destructive/80">
                        {errorMessage}
                      </p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
                  <FormFields />
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  // Stacked Layout (Default)
  return (
    <section className={cn("w-full", className)}>
      <div className="mx-auto max-w-xl">
        {/* Header */}
        <div className="mb-10 text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            {headline}
          </h2>
          <p className="mt-4 text-pretty leading-relaxed text-muted-foreground lg:leading-7">
            {introText}
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl border border-border/40 bg-card/80 p-8 shadow-sm backdrop-blur-sm">
          {/* Error Alert */}
          {submitStatus === "error" && (
            <div className="mb-6 flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
              <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
              <p className="text-sm leading-relaxed text-destructive">
                {errorMessage}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
            <FormFields />
          </form>
        </div>
      </div>
    </section>
  )
}
