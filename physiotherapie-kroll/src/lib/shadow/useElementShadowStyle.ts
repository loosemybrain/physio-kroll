import type { ElementConfig } from "@/types/cms"
import { resolveBoxShadow } from "@/lib/shadow/resolveBoxShadow"
import { useMemo } from "react"

interface UseElementShadowStyleProps {
  elementId?: string
  elementConfig?: ElementConfig
}

/**
 * Hook to get shadow style for an element with ID
 * Usage: <div style={useElementShadowStyle({ elementId: "my-id", elementConfig })} />
 */
export function useElementShadowStyle({
  elementId,
  elementConfig,
}: UseElementShadowStyleProps): React.CSSProperties {
  return useMemo(() => {
    if (!elementId || !elementConfig) {
      return {}
    }

    const boxShadow = resolveBoxShadow(elementConfig.style?.shadow)
    if (!boxShadow) {
      return {}
    }

    return { boxShadow }
  }, [elementId, elementConfig])
}
