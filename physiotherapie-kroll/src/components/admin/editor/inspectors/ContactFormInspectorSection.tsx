"use client"

import * as React from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import type { CMSBlock, ContactFormBlock } from "@/types/cms"
import { setByPath } from "@/lib/cms/editorPathOps"
import { isValidEmail } from "@/lib/contact/contact-email-resolver"

export interface ContactFormInspectorSectionProps {
  selectedBlock: CMSBlock
  selectedBlockId: string | null
  updateBlockPropsById: (
    blockId: string,
    updater: (prevProps: Record<string, unknown>) => CMSBlock["props"]
  ) => void
  fieldRefs: React.MutableRefObject<Record<string, HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null>>
  isTypingRef: React.MutableRefObject<boolean>
}

const ContactFormInspectorSectionContent = React.memo(
  ({
    selectedBlock,
    selectedBlockId,
    updateBlockPropsById,
    fieldRefs,
    isTypingRef,
  }: ContactFormInspectorSectionProps) => {
    const props = selectedBlock.props as ContactFormBlock["props"]
    const recipientEmail = props.recipientEmail ?? ""

    const handleFieldChange = (field: string, value: unknown) => {
      if (!selectedBlockId) return
      isTypingRef.current = true
      updateBlockPropsById(selectedBlockId, (prevProps) => {
        const next = setByPath(prevProps, field, value) as CMSBlock["props"]
        return next
      })
      setTimeout(() => {
        isTypingRef.current = false
      }, 50)
    }

    const isValidEmailValue = recipientEmail === "" || isValidEmail(recipientEmail)
    const emailError = recipientEmail !== "" && !isValidEmail(recipientEmail) ? "Invalid email format" : null
    const registerFieldRef = React.useCallback(
      (key: string, el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null) => {
        // eslint-disable-next-line react-hooks/immutability -- imperative ref registry for inspector focus
        fieldRefs.current[key] = el
      },
      [fieldRefs]
    )

    return (
      <div className="space-y-6 p-4">
        {/* Delivery Configuration Section */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Kontakt / Zustellung</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Konfigurieren Sie, wohin die Formularinhalte gesendet werden
            </p>
          </div>

          <Separator />

          {/* Recipient Email Field */}
          <div className="space-y-2">
            <Label htmlFor="recipient-email" className="text-sm font-medium">
              Empfangs-E-Mail
            </Label>
            <Input
              id="recipient-email"
              ref={(el) => registerFieldRef("recipientEmail", el)}
              type="email"
              placeholder="contact@example.com"
              value={recipientEmail}
              onChange={(e) => handleFieldChange("recipientEmail", e.target.value || undefined)}
              onBlur={(e) => {
                // Trim and normalize on blur
                const value = e.target.value.trim()
                if (value !== recipientEmail) {
                  handleFieldChange("recipientEmail", value || undefined)
                }
              }}
              className={emailError ? "border-destructive" : ""}
              aria-invalid={!!emailError}
              aria-describedby={emailError ? "recipient-email-error" : undefined}
            />
            {emailError && (
              <p id="recipient-email-error" className="text-xs text-destructive" role="alert">
                {emailError}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Wenn leer: verwendet ENV-Fallback (CONTACT_EMAIL_PHYSIOTHERAPY / CONTACT_EMAIL_PHYSIOKONZEPT) pro
              Marke.
            </p>
          </div>

          <Separator />

          {/* Help Text */}
          <div className="rounded-lg bg-muted/50 p-3 text-xs">
            <p className="font-medium text-foreground">Info:</p>
            <ul className="mt-2 space-y-1 text-muted-foreground">
              <li>
                • <strong>CMS-Wert</strong>: Überschreibt alle ENV-Variablen für diesen Block
              </li>
              <li>
                • <strong>ENV-Fallback</strong>: Wird verwendet, wenn Feld leer ist
              </li>
              <li>
                • <strong>Testmodus</strong>: Server-seitig mit CONTACT_TEST_MODE=true aktivierbar
              </li>
            </ul>
          </div>
        </div>
      </div>
    )
  }
)

ContactFormInspectorSectionContent.displayName = "ContactFormInspectorSectionContent"

export const ContactFormInspectorSection = ContactFormInspectorSectionContent
