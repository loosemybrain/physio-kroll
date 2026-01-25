"use client"

import { useState, useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import type { ContactFormBlock } from "@/types/cms"
import { useBrand } from "@/components/brand/BrandProvider"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"

type ContactFormBlockProps = ContactFormBlock["props"] & {
  blockId?: string
  pageSlug?: string
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
  blockId,
  pageSlug,
}: ContactFormBlockProps) {
  const { brand: activeBrand } = useBrand()
  const [formState, setFormState] = useState<FormState>("idle")
  const [submitError, setSubmitError] = useState<string | null>(null)
  const renderTimeRef = useRef<number>(Date.now())
  const [submitHovered, setSubmitHovered] = useState(false)

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

  if (formState === "success") {
    return (
      <section className="py-12 px-4">
        <div className={cn("mx-auto max-w-2xl")}>
          <Alert variant="default" className="border-green-200 bg-green-50 dark:bg-green-950/20">
            <CheckCircle2 className="size-4 text-green-600 dark:text-green-400" />
            <AlertTitle className="text-green-900 dark:text-green-100">{successTitle}</AlertTitle>
            <AlertDescription className="text-green-800 dark:text-green-200">{successText}</AlertDescription>
          </Alert>
        </div>
      </section>
    )
  }

  return (
    <section className="py-12 px-4">
      <div className={cn("mx-auto", layout === "split" ? "max-w-6xl" : "max-w-2xl")}>
        <div className={cn(layout === "split" && "grid md:grid-cols-2 gap-8 items-start")}>
          {/* Header */}
          <div className={cn(layout === "split" && "md:sticky md:top-8")}>
            <h2 className="text-3xl font-bold mb-4" style={headingColor ? ({ color: headingColor } as React.CSSProperties) : undefined}>
              {heading}
            </h2>
            {text && (
              <p className="text-muted-foreground mb-6" style={textColor ? ({ color: textColor } as React.CSSProperties) : undefined}>
                {text}
              </p>
            )}
          </div>

          {/* Form */}
          <div>
            {formState === "error" && submitError && (
              <Alert variant="destructive" className="mb-6">
                <XCircle className="size-4" />
                <AlertTitle>Fehler</AlertTitle>
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

                return (
                  <div key={field.id} className="space-y-2">
                    <Label htmlFor={field.id} style={labelColor ? ({ color: labelColor } as React.CSSProperties) : undefined}>
                      {field.label}
                      {field.required && <span className="text-destructive ml-1">*</span>}
                    </Label>
                    {isTextarea ? (
                      <Textarea
                        id={field.id}
                        {...register(field.id as keyof FormData)}
                        placeholder={field.placeholder}
                        required={field.required}
                        rows={6}
                        aria-invalid={!!fieldError}
                        aria-describedby={fieldError ? `${field.id}-error` : undefined}
                        className={cn(fieldError && "border-destructive")}
                        style={{
                          color: inputTextColor || undefined,
                          backgroundColor: inputBgColor || undefined,
                          borderColor: inputBorderColor || undefined,
                        }}
                      />
                    ) : (
                      <Input
                        id={field.id}
                        type={field.type === "email" ? "email" : field.type === "phone" ? "tel" : "text"}
                        {...register(field.id as keyof FormData)}
                        placeholder={field.placeholder}
                        required={field.required}
                        aria-invalid={!!fieldError}
                        aria-describedby={fieldError ? `${field.id}-error` : undefined}
                        className={cn(fieldError && "border-destructive")}
                        style={{
                          color: inputTextColor || undefined,
                          backgroundColor: inputBgColor || undefined,
                          borderColor: inputBorderColor || undefined,
                        }}
                      />
                    )}
                    {fieldError && (
                      <p id={`${field.id}-error`} className="text-sm text-destructive" role="alert">
                        {fieldError.message as string}
                      </p>
                    )}
                  </div>
                )
              })}

              {/* Privacy text and consent */}
              <div className="space-y-3 pt-2">
                <p className="text-sm text-muted-foreground" style={privacyTextColor ? ({ color: privacyTextColor } as React.CSSProperties) : undefined}>
                  {privacyText}{" "}
                  <a
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
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="consent"
                      checked={consentChecked}
                      onCheckedChange={(checked) => setValue("consent", checked === true)}
                      aria-invalid={!!errors.consent}
                      className={cn(errors.consent && "border-destructive")}
                    />
                    <Label
                      htmlFor="consent"
                      className="text-sm font-normal cursor-pointer"
                      style={consentLabelColor ? ({ color: consentLabelColor } as React.CSSProperties) : undefined}
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

              {/* Submit button */}
              <Button
                type="submit"
                disabled={isSubmitting || formState === "loading"}
                className="w-full"
                style={{
                  color: buttonTextColor || undefined,
                  backgroundColor: buttonBgColor
                    ? (submitHovered && buttonHoverBgColor ? buttonHoverBgColor : buttonBgColor)
                    : undefined,
                  borderColor: buttonBorderColor || undefined,
                }}
                onMouseEnter={() => setSubmitHovered(true)}
                onMouseLeave={() => setSubmitHovered(false)}
              >
                {isSubmitting || formState === "loading" ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Wird gesendet...
                  </>
                ) : (
                  submitLabel
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
