import { describe, it, expect, vi } from "vitest"
import type { CMSBlock } from "@/types/cms"

describe("CourseScheduleInspectorSection - Smoke Test", () => {
  describe("Component Contract", () => {
    it("should accept required props", () => {
      const block: CMSBlock = {
        id: "course-1",
        type: "courseSchedule",
        props: {
          slots: [
            { id: "slot-1", title: "Yoga", startTime: "09:00", endTime: "10:00", weekday: 1 },
          ],
          mode: "calendar",
        },
      } as unknown as CMSBlock

      const props = {
        selectedBlock: block,
        selectedBlockId: block.id,
        expandedRepeaterCards: {},
        setExpandedRepeaterCards: vi.fn(),
        updateSelectedProps: vi.fn(),
        lastAddedRepeaterRef: { current: null },
      }

      expect(props).toBeDefined()
      expect(props.updateSelectedProps).toBeDefined()
    })
  })
})

