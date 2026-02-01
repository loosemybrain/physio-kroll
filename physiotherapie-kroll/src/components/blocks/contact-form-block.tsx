"use client"

import { useState, useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import type { ContactFormBlock } from "@/types/cms"
import { useBrand } from "@/components/brand/BrandProvider"
import { CheckCircle2, AlertCircle, Loader2, Send, Mail, Clock, Phone, MapPin } from "lucide-react"
import * as React from "react"
import { useElementShadowStyle } from "@/lib/shadow"
import type { CommonBlockProps } from "@/types/cms"

type ContactFormBlockProps = ContactFormBlock["props"] & CommonBlockProps & {
  blockId?: string
  pageSlug?: string
  editable?: boolean
  onEditField?: (blockId: string, fieldPath: string, anchorRect?: DOMRect) => void
  onElementClick?: (blockId: string, elementId: string) => void
  selectedElementId?: string | null
}

/**
 * Builds Zod schema from form field definitions
 */
function buildFormSchema(fields: ContactFormBlock["props"]["fields"], requireConsent: boolean) {
  const schemaFields: Record<string, z.ZodTypeAny> = {
    // Honeypot field (must be empty)
    _hp: z.string().max(0, "Spam detected"),
    // Timestamp for time-to-submit check
    _ts: z.number(),
  }

  fields.forEach((field) => {
    if (field.type === "email") {
      schemaFields[field.id] = field.required
        ? z.string().email("Ungültige E-Mail-Adresse").min(1, "E-Mail ist erforderlich")
        : z.string().email("Ungültige E-Mail-Adresse").optional().or(z.literal(""))
    } else if (field.type === "message") {
      schemaFields[field.id] = field.required
        ? z.string().min(10, "Nachricht muss mindestens 10 Zeichen lang sein")
        : z.string().optional()
    } else {
      schemaFields[field.id] = field.required
        ? z.string().min(1, `${field.label} ist erforderlich`)
        : z.string().optional()
    }
  })

  if (requireConsent) {
    schemaFields.consent = z.boolean().refine((val) => val === true, {
      message: "Sie müssen der Datenschutzerklärung zustimmen",
    })
  }

  return z.object(schemaFields)
}

type FormState = "idle" | "loading" | "success" | "error"

/**
 * Floating label input component with premium styling
 */
function FloatingLabelInputField({
  id,
  label,
  type = "text",
  required,
  placeholder,
  error,
  errorId,
  register,
  styleOverrides,
}: {
  id: string
  label: string
  type?: string
  required?: boolean
  placeholder?: string
  error?: string
  errorId?: string
  register: any
  styleOverrides?: React.CSSProperties
}) {
  const [isFocused, setIsFocused] = React.useState(false)
  const [hasValue, setHasValue] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  // Check value on mount and when ref changes
  React.useEffect(() => {
    if (inputRef.current) {
      setHasValue(inputRef.current.value.length > 0)
    }
  }, [])

  const handleFocus = () => {
    setIsFocused(true)
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false)
    setHasValue(e.target.value.length > 0)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasValue(e.target.value.length > 0)
  }

  const { ref, ...registerProps } = register(id)

  return (
    <div className="group relative">
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
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
        style={styleOverrides}
        ref={(el) => {
          inputRef.current = el
          if (ref) ref(el)
        }}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChange={handleChange}
        {...registerProps}
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

/**
 * Floating label textarea component with premium styling
 */
function FloatingLabelTextareaField({
  id,
  label,
  required,
  placeholder,
  error,
  errorId,
  register,
  styleOverrides,
}: {
  id: string
  label: string
  required?: boolean
  placeholder?: string
  error?: string
  errorId?: string
  register: any
  styleOverrides?: React.CSSProperties
}) {
  const [isFocused, setIsFocused] = React.useState(false)
  const [hasValue, setHasValue] = React.useState(false)
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  // Check value on mount and when ref changes
  React.useEffect(() => {
    if (textareaRef.current) {
      setHasValue(textareaRef.current.value.length > 0)
    }
  }, [])

  const handleFocus = () => {
    setIsFocused(true)
  }

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(false)
    setHasValue(e.target.value.length > 0)
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setHasValue(e.target.value.length > 0)
  }

  const { ref, ...registerProps } = register(id)

  return (
    <div className="group relative">
      <Textarea
        id={id}
        placeholder={placeholder}
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
        style={styleOverrides}
        ref={(el) => {
          textareaRef.current = el
          if (ref) ref(el)
        }}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChange={handleChange}
        {...registerProps}
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
  heading,
  text,
  headingColor,
  textColor,
  labelColor,
  inputTextColor,
  inputBgColor,
  inputBorderColor,
  privacyTextColor,
  privacyLinkColor,
  consentLabelColor,
  buttonTextColor,
  buttonBgColor,
  buttonHoverBgColor,
  buttonBorderColor,
  fields,
  submitLabel,
  successTitle,
  successText,
  errorText,
  privacyText,
  privacyLink,
  requireConsent = false,
  consentLabel,
  layout = "stack",
  elements,
  blockId,
  pageSlug,
  editable = false,
  onEditField,
  onElementClick,
  selectedElementId,
}: ContactFormBlockProps) {
  const { brand: activeBrand } = useBrand()
  const [formState, setFormState] = useState<FormState>("idle")
  const [submitError, setSubmitError] = useState<string | null>(null)
  const renderTimeRef = useRef<number>(Date.now())

  // Collect props for shadow access (elements property from CommonBlockProps)
  const propsFromBlock = { elements: (elements ?? {}) } as any

  // Normalize layout: accept "stacked" (legacy) and normalize to "split"
  const normalizedLayout = layout === "stacked" ? "split" : layout

  const formSchema = buildFormSchema(fields, requireConsent)
  type FormData = z.infer<typeof formSchema>

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      _hp: "",
      _ts: renderTimeRef.current,
      consent: false,
    },
  })

  // Set timestamp on mount
  useEffect(() => {
    setValue("_ts", renderTimeRef.current)
  }, [setValue])

  const onSubmit = async (data: FormData) => {
    // Spam checks
    // 1. Honeypot check
    const hp = (data as Record<string, unknown>)["_hp"]
    if (typeof hp === "string" && hp.length > 0) {
      console.warn("[ContactForm] Honeypot triggered")
      setFormState("error")
      setSubmitError("Spam detected")
      return
    }

    // 2. Time-to-submit check (must be at least 800ms after render)
    const tsRaw = (data as Record<string, unknown>)["_ts"]
    const ts =
      typeof tsRaw === "number"
        ? tsRaw
        : typeof tsRaw === "string"
          ? Number(tsRaw)
          : NaN
    const safeTs = Number.isFinite(ts) ? ts : renderTimeRef.current
    const timeToSubmit = Date.now() - safeTs
    if (timeToSubmit < 800) {
      console.warn("[ContactForm] Time-to-submit check failed:", timeToSubmit, "ms")
      setFormState("error")
      setSubmitError("Bitte warten Sie einen Moment, bevor Sie das Formular absenden.")
      return
    }

    setFormState("loading")
    setSubmitError(null)

    try {
      // Map form data to submission format
      const submission: Record<string, string | boolean> = {}
      fields.forEach((field) => {
        const value = data[field.id as keyof FormData]
        if (value !== undefined && value !== null && value !== "") {
          // Map field types to submission keys
          if (field.type === "name") {
            submission.name = String(value)
          } else if (field.type === "email") {
            submission.email = String(value)
          } else if (field.type === "phone") {
            submission.phone = String(value)
          } else if (field.type === "subject") {
            submission.subject = String(value)
          } else if (field.type === "message") {
            submission.message = String(value)
          }
        }
      })

      const consentRaw = (data as Record<string, unknown>)["consent"]
      if (requireConsent && consentRaw === true) {
        submission.consent = true
      }

      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          brand: activeBrand,
          pageSlug: pageSlug || "",
          blockId: blockId,
          ...submission,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || errorText || "Fehler beim Senden der Nachricht")
      }

      setFormState("success")
      reset()
    } catch (error) {
      console.error("[ContactForm] Submission error:", error)
      setFormState("error")
      setSubmitError(error instanceof Error ? error.message : errorText || "Fehler beim Senden der Nachricht")
    }
  }

  const consentValue = (watch() as Record<string, unknown>)["consent"]
  const consentChecked = consentValue === true

  // Handle inline edit
  const handleInlineEdit = (fieldPath: string) => (e: React.MouseEvent) => {
    if (!editable || !blockId || !onEditField) return
    e.preventDefault()
    e.stopPropagation()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    onEditField(blockId, fieldPath, rect)
  }

  // Premium Success State
  if (formState === "success") {
    return (
      <section className="relative w-full overflow-hidden py-12 px-4">
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
              {successTitle || "Nachricht gesendet"}
            </h3>
            <p className="max-w-sm leading-relaxed text-muted-foreground">
              {successText || "Vielen Dank für Ihre Nachricht! Wir werden uns schnellstmöglich bei Ihnen melden."}
            </p>
            <Button
              variant="outline"
              onClick={() => setFormState("idle")}
              className="mt-10 rounded-xl px-6 transition-all duration-300 hover:-translate-y-0.5 hover:bg-background hover:shadow-lg"
            >
              Weitere Nachricht senden
            </Button>
          </div>
        </div>
      </section>
    )
  }

  // Split Layout
  if (normalizedLayout === "split") {
    const formCardShadow = useElementShadowStyle({
      elementId: "formCard",
      elementConfig: (propsFromBlock as any)?.elements?.["formCard"],
    })
    const formHeadingShadow = useElementShadowStyle({
      elementId: "heading",
      elementConfig: (propsFromBlock as any)?.elements?.["heading"],
    })
    const submitButtonShadow = useElementShadowStyle({
      elementId: "submitButton",
      elementConfig: (propsFromBlock as any)?.elements?.["submitButton"],
    })
    const contactCardShadow = useElementShadowStyle({
      elementId: "contactCard",
      elementConfig: (propsFromBlock as any)?.elements?.["contactCard"],
    })
    
    const { contactInfoCards } = propsFromBlock

    return (
      <section className="relative w-full overflow-hidden py-12 px-4">
        {/* Decorative background elements - subtle ambient glow only */}
        <div className="pointer-events-none absolute inset-0 -z-20" aria-hidden="true">
          <div className="absolute -left-32 top-1/4 size-96 rounded-full bg-primary/2 blur-3xl" />
          <div className="absolute -right-32 bottom-1/4 size-80 rounded-full bg-primary/2 blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-5 lg:gap-16">
            {/* Left Side - Content (2 columns) */}
            <div className="flex flex-col justify-center lg:col-span-2">
              {/* Badge */}
              <span className="mb-4 inline-flex w-fit items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-primary">
                <Mail className="size-3.5" />
                Kontakt
              </span>

              {/* Headline */}
              <h2 
                data-cms-field="heading"
                data-element-id="heading"
                className={cn(
                  "text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl",
                  editable && blockId && onEditField && "cursor-pointer rounded px-1 transition-colors hover:bg-primary/10"
                )}
                style={{
                  ...(formHeadingShadow as any),
                  ...(headingColor ? { color: headingColor } : {}),
                }}
                onClick={handleInlineEdit("props.heading")}
              >
                {heading}
              </h2>

              {/* Intro Text */}
              {text && (
                <p 
                  data-cms-field="text"
                  className={cn(
                    "mt-6 max-w-md text-pretty leading-relaxed text-muted-foreground lg:text-lg lg:leading-8",
                    editable && blockId && onEditField && "cursor-pointer rounded px-1 transition-colors hover:bg-primary/10"
                  )}
                  style={textColor ? ({ color: textColor } as React.CSSProperties) : undefined}
                  onClick={handleInlineEdit("props.text")}
                >
                  {text}
                </p>
              )}

              {/* Contact Info Cards */}
              <div className="mt-12 space-y-4">
                {(() => {
                  // Default cards (fallback wenn contactInfoCards nicht definiert)
                  const defaults: typeof contactInfoCards = [
                    { id: "hours", icon: "clock", title: "Schnelle Antwort", value: "Innerhalb von 24 Stunden" },
                    { id: "consultation", icon: "phone", title: "Kostenlose Beratung", value: "Unverbindliches Erstgespräch" },
                    { id: "location", icon: "mapPin", title: "Lokale Betreuung", value: "Persönlich vor Ort für Sie da" },
                  ]
                  const cards = contactInfoCards || defaults
                  
                  return cards?.map((card) => {
                    const cardElementId = `contact-info-card-${card.id}`
                    const cardShadow = useElementShadowStyle({
                      elementId: cardElementId,
                      elementConfig: (elements ?? {})[cardElementId],
                    })
                    
                    const IconComponent = card.icon === "mail" ? Mail 
                      : card.icon === "phone" ? Phone 
                      : card.icon === "clock" ? Clock 
                      : MapPin
                    
                    const content = (
                      <>
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                          <IconComponent className="size-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{card.title}</p>
                          <p className="text-sm text-muted-foreground">{card.value}</p>
                        </div>
                      </>
                    )
                    
                    return (
                      <div 
                        key={card.id}
                        data-element-id={cardElementId}
                        style={cardShadow as any}
                        onClick={() => onElementClick?.(blockId || "", cardElementId)}
                        className="group flex items-center gap-4 rounded-xl border border-border/30 bg-card/40 p-4 backdrop-blur-sm transition-all duration-300 hover:border-border/60 hover:bg-card/60 cursor-pointer"
                      >
                        {card.href ? (
                          <a href={card.href} rel="noreferrer" target="_blank" className="flex items-center gap-4 w-full">
                            {content}
                          </a>
                        ) : (
                          content
                        )}
                      </div>
                    )
                  })
                })()}
              </div>
            </div>

            {/* Right Side - Form Card (3 columns) */}
            <div className="relative lg:col-span-3">
              <div 
                data-element-id="formCard"
                style={formCardShadow as any}
                className="relative rounded-3xl border border-border/40 bg-card p-8 shadow-2xl shadow-primary/5 lg:p-12">
                {/* Error Alert */}
                {formState === "error" && submitError && (
                  <div className="mb-8 flex items-start gap-4 rounded-xl border border-destructive/20 bg-destructive/5 p-5">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
                      <AlertCircle className="size-5 text-destructive" />
                    </div>
                    <div>
                      <p className="font-medium text-destructive">Fehler beim Senden</p>
                      <p className="mt-1 text-sm leading-relaxed text-destructive/80">
                        {submitError}
                      </p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Honeypot field (hidden) */}
                  <input
                    type="text"
                    {...register("_hp")}
                    tabIndex={-1}
                    autoComplete="off"
                    className="sr-only"
                    aria-hidden="true"
                  />

                  {/* Hidden timestamp */}
                  <input type="hidden" {...register("_ts", { valueAsNumber: true })} />

                  {/* Dynamic form fields - Two column grid */}
                  <div className="grid gap-6 sm:grid-cols-2">
                    {fields.map((field) => {
                      const fieldError = errors[field.id as keyof FormData]
                      const isTextarea = field.type === "message"
                      const inputStyleOverrides: React.CSSProperties = {
                        color: inputTextColor || undefined,
                        backgroundColor: inputBgColor || undefined,
                        borderColor: inputBorderColor || undefined,
                      }

                      if (isTextarea) {
                        return (
                          <div key={field.id} className="sm:col-span-2">
                            <FloatingLabelTextareaField
                              id={field.id}
                              label={field.label}
                              required={field.required}
                              placeholder={field.placeholder}
                              error={fieldError?.message as string | undefined}
                              errorId={`${field.id}-error`}
                              register={register}
                              styleOverrides={inputStyleOverrides}
                            />
                          </div>
                        )
                      }

                      return (
                        <FloatingLabelInputField
                          key={field.id}
                          id={field.id}
                          label={field.label}
                          type={field.type === "email" ? "email" : field.type === "phone" ? "tel" : "text"}
                          required={field.required}
                          placeholder={field.placeholder}
                          error={fieldError?.message as string | undefined}
                          errorId={`${field.id}-error`}
                          register={register}
                          styleOverrides={inputStyleOverrides}
                        />
                      )
                    })}
                  </div>

                  {/* Privacy text and consent */}
                  <div className="space-y-3 pt-2">
                    <p 
                      data-cms-field="privacyText"
                      className={cn(
                        "text-sm text-muted-foreground",
                        editable && blockId && onEditField && "cursor-pointer rounded px-1 transition-colors hover:bg-primary/10"
                      )}
                      style={privacyTextColor ? ({ color: privacyTextColor } as React.CSSProperties) : undefined}
                      onClick={handleInlineEdit("props.privacyText")}
                    >
                      {privacyText}{" "}
                      <a
                        data-cms-field="privacyLink.label"
                        href={privacyLink.href}
                        className="text-primary underline hover:no-underline"
                        style={privacyLinkColor ? ({ color: privacyLinkColor } as React.CSSProperties) : undefined}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {privacyLink.label}
                      </a>
                      .
                    </p>

                    {requireConsent && (
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="consent"
                          checked={consentChecked}
                          onCheckedChange={(checked) => setValue("consent", checked === true)}
                          aria-invalid={!!errors.consent}
                          className={cn(errors.consent && "border-destructive")}
                        />
                        <Label
                          data-cms-field="consentLabel"
                          htmlFor="consent"
                          className={cn(
                            "text-sm font-normal cursor-pointer",
                            editable && blockId && onEditField && "transition-colors hover:bg-primary/10"
                          )}
                          style={consentLabelColor ? ({ color: consentLabelColor } as React.CSSProperties) : undefined}
                          onClick={handleInlineEdit("props.consentLabel")}
                        >
                          {consentLabel || "Ich habe die Datenschutzerklärung gelesen und bin mit der Verarbeitung meiner Daten zur Kontaktaufnahme einverstanden."}
                          <span className="text-destructive ml-1">*</span>
                        </Label>
                      </div>
                    )}
                    {errors.consent && (
                      <p className="text-sm text-destructive" role="alert">
                        {errors.consent.message as string}
                      </p>
                    )}
                  </div>

                  {/* Premium Submit Button with shimmer */}
                  <div className="pt-4" data-element-id="submitButton" style={submitButtonShadow as any}>
                    <Button
                      type="submit"
                      disabled={isSubmitting || formState === "loading"}
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
                      style={{
                        color: buttonTextColor || undefined,
                        backgroundColor: buttonBgColor || undefined,
                        borderColor: buttonBorderColor || undefined,
                      }}
                    >
                      {/* Shimmer effect */}
                      <span className="absolute inset-0 -z-10 bg-[linear-gradient(110deg,transparent_25%,rgba(255,255,255,0.15)_50%,transparent_75%)] bg-[length:200%_100%] opacity-0 transition-opacity duration-500 group-hover:animate-shimmer group-hover:opacity-100" />

                      {isSubmitting || formState === "loading" ? (
                        <span className="flex items-center justify-center gap-3">
                          <Loader2 className="size-5 animate-spin" />
                          <span>Wird gesendet...</span>
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-3">
                          <span>{submitLabel || "Nachricht senden"}</span>
                          <Send className="size-4 transition-transform duration-300 ease-out group-hover:translate-x-1" />
                        </span>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  // Stacked Layout (Default)
  const stackedHeadingShadow = useElementShadowStyle({
    elementId: "stackedHeading",
    elementConfig: (propsFromBlock as any)?.elements?.["stackedHeading"],
  })
  const formCardStackedShadow = useElementShadowStyle({
    elementId: "formCardStacked",
    elementConfig: (propsFromBlock as any)?.elements?.["formCardStacked"],
  })
  const stackedSubmitButtonShadow = useElementShadowStyle({
    elementId: "stackedSubmitButton",
    elementConfig: (propsFromBlock as any)?.elements?.["stackedSubmitButton"],
  })

  return (
    <section className="w-full py-12 px-4">
      <div className="mx-auto max-w-xl">
        {/* Header */}
        <div className="mb-10 text-center">
          <h2 
            data-element-id="stackedHeading"
            className={cn(
              "text-balance text-3xl font-semibold tracking-tight text-foreground md:text-4xl",
              editable && blockId && onEditField && "cursor-pointer rounded px-1 transition-colors hover:bg-primary/10"
            )}
            style={{
              ...(stackedHeadingShadow as any),
              ...(headingColor ? { color: headingColor } : {}),
            }}
            onClick={handleInlineEdit("props.heading")}
            data-cms-field="heading"
          >
            {heading}
          </h2>
          {text && (
            <p 
              data-cms-field="text"
              className={cn(
                "mt-4 text-pretty leading-relaxed text-muted-foreground lg:leading-7",
                editable && blockId && onEditField && "cursor-pointer rounded px-1 transition-colors hover:bg-primary/10"
              )}
              style={textColor ? ({ color: textColor } as React.CSSProperties) : undefined}
              onClick={handleInlineEdit("props.text")}
            >
              {text}
            </p>
          )}
        </div>

        {/* Form Card */}
        <div 
            data-element-id="formCardStacked"
          style={formCardStackedShadow as any}
          className="rounded-2xl border border-border/40 bg-card/80 p-8 shadow-sm backdrop-blur-sm">
          {/* Error Alert */}
          {formState === "error" && submitError && (
            <div className="mb-6 flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
              <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
              <p className="text-sm leading-relaxed text-destructive">
                {submitError}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Honeypot field (hidden) */}
            <input
              type="text"
              {...register("_hp")}
              tabIndex={-1}
              autoComplete="off"
              className="sr-only"
              aria-hidden="true"
            />

            {/* Hidden timestamp */}
            <input type="hidden" {...register("_ts", { valueAsNumber: true })} />

            {/* Dynamic form fields */}
            {fields.map((field) => {
              const fieldError = errors[field.id as keyof FormData]
              const isTextarea = field.type === "message"
              const inputStyleOverrides: React.CSSProperties = {
                color: inputTextColor || undefined,
                backgroundColor: inputBgColor || undefined,
                borderColor: inputBorderColor || undefined,
              }

              if (isTextarea) {
                return (
                  <FloatingLabelTextareaField
                    key={field.id}
                    id={field.id}
                    label={field.label}
                    required={field.required}
                    placeholder={field.placeholder}
                    error={fieldError?.message as string | undefined}
                    errorId={`${field.id}-error`}
                    register={register}
                    styleOverrides={inputStyleOverrides}
                  />
                )
              }

              return (
                <FloatingLabelInputField
                  key={field.id}
                  id={field.id}
                  label={field.label}
                  type={field.type === "email" ? "email" : field.type === "phone" ? "tel" : "text"}
                  required={field.required}
                  placeholder={field.placeholder}
                  error={fieldError?.message as string | undefined}
                  errorId={`${field.id}-error`}
                  register={register}
                  styleOverrides={inputStyleOverrides}
                />
              )
            })}

            {/* Privacy text and consent */}
            <div className="space-y-3 pt-2">
              <p 
                data-cms-field="privacyText"
                className={cn(
                  "text-sm text-muted-foreground",
                  editable && blockId && onEditField && "cursor-pointer rounded px-1 transition-colors hover:bg-primary/10"
                )}
                style={privacyTextColor ? ({ color: privacyTextColor } as React.CSSProperties) : undefined}
                onClick={handleInlineEdit("props.privacyText")}
              >
                {privacyText}{" "}
                <a
                  data-cms-field="privacyLink.label"
                  href={privacyLink.href}
                  className="text-primary underline hover:no-underline"
                  style={privacyLinkColor ? ({ color: privacyLinkColor } as React.CSSProperties) : undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {privacyLink.label}
                </a>
                .
              </p>

              {requireConsent && (
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="consent"
                    checked={consentChecked}
                    onCheckedChange={(checked) => setValue("consent", checked === true)}
                    aria-invalid={!!errors.consent}
                    className={cn(errors.consent && "border-destructive")}
                  />
                  <Label
                    data-cms-field="consentLabel"
                    htmlFor="consent"
                    className={cn(
                      "text-sm font-normal cursor-pointer",
                      editable && blockId && onEditField && "transition-colors hover:bg-primary/10"
                    )}
                    style={consentLabelColor ? ({ color: consentLabelColor } as React.CSSProperties) : undefined}
                    onClick={handleInlineEdit("props.consentLabel")}
                  >
                    {consentLabel || "Ich habe die Datenschutzerklärung gelesen und bin mit der Verarbeitung meiner Daten zur Kontaktaufnahme einverstanden."}
                    <span className="text-destructive ml-1">*</span>
                  </Label>
                </div>
              )}
              {errors.consent && (
                <p className="text-sm text-destructive" role="alert">
                  {errors.consent.message as string}
                </p>
              )}
            </div>

            {/* Premium Submit Button with shimmer */}
            <div className="pt-4" data-element-id="stackedSubmitButton" style={stackedSubmitButtonShadow as any}>
              <Button
                type="submit"
                disabled={isSubmitting || formState === "loading"}
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
                style={{
                  color: buttonTextColor || undefined,
                  backgroundColor: buttonBgColor || undefined,
                  borderColor: buttonBorderColor || undefined,
                }}
              >
                {/* Shimmer effect */}
                <span className="absolute inset-0 -z-10 bg-[linear-gradient(110deg,transparent_25%,rgba(255,255,255,0.15)_50%,transparent_75%)] bg-[length:200%_100%] opacity-0 transition-opacity duration-500 group-hover:animate-shimmer group-hover:opacity-100" />

                {isSubmitting || formState === "loading" ? (
                  <span className="flex items-center justify-center gap-3">
                    <Loader2 className="size-5 animate-spin" />
                    <span>Wird gesendet...</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-3">
                    <span>{submitLabel || "Nachricht senden"}</span>
                    <Send className="size-4 transition-transform duration-300 ease-out group-hover:translate-x-1" />
                  </span>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}
