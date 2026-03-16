import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { UniversalRepeaterInspector } from "../../repeater/UniversalRepeaterInspector"

interface TestItem {
  id: string
  label: string
}

describe("UniversalRepeaterInspector", () => {
  const mockItems: TestItem[] = [
    { id: "item-1", label: "Item 1" },
    { id: "item-2", label: "Item 2" },
    { id: "item-3", label: "Item 3" },
  ]

  describe("Render", () => {
    it("should render without crash", () => {
      interface TestItem {
        id: string
        label: string
      }
      const mockItems: TestItem[] = [
        { id: "item-1", label: "Item 1" },
        { id: "item-2", label: "Item 2" },
      ]

      const { container } = render(
        <UniversalRepeaterInspector<TestItem>
          items={mockItems}
          getItemId={(item) => item.id}
          getItemLabel={(item) => item.label}
          renderContent={(item) => <div>{item.label} content</div>}
          expandedId={null}
          onToggle={vi.fn()}
          onCollapseAll={vi.fn()}
          countLabel="2 Items"
          addLabel="Add Item"
          onAdd={vi.fn()}
          onRemove={vi.fn()}
        />
      )
      expect(container).toBeTruthy()
    })

    it("should display items correctly", () => {
      render(
        <UniversalRepeaterInspector<TestItem>
          items={mockItems}
          getItemId={(item) => item.id}
          getItemLabel={(item) => item.label}
          renderContent={(item) => <div>{item.label} content</div>}
          expandedId={null}
          onToggle={vi.fn()}
          onCollapseAll={vi.fn()}
          countLabel="3 Items"
          addLabel="Add Item"
          onAdd={vi.fn()}
          onRemove={vi.fn()}
        />
      )
      expect(screen.getByText("Item 1")).toBeInTheDocument()
      expect(screen.getByText("Item 2")).toBeInTheDocument()
      expect(screen.getByText("Item 3")).toBeInTheDocument()
    })

    it("should show empty state when empty", () => {
      render(
        <UniversalRepeaterInspector<TestItem>
          items={[]}
          getItemId={(item: TestItem) => item.id}
          renderContent={() => <div>content</div>}
          expandedId={null}
          onToggle={vi.fn()}
          onCollapseAll={vi.fn()}
          countLabel="0 Items"
          addLabel="Add Item"
          onAdd={vi.fn()}
          onRemove={vi.fn()}
          emptyLabel="No items"
        />
      )
      expect(screen.getByText("No items")).toBeInTheDocument()
    })
  })

  describe("Expand/Collapse", () => {
    it("should call onToggle when item is clicked", () => {
      const onToggle = vi.fn()
      render(
        <UniversalRepeaterInspector<TestItem>
          items={mockItems}
          getItemId={(item) => item.id}
          getItemLabel={(item) => item.label}
          renderContent={(item) => <div>{item.label} content</div>}
          expandedId={null}
          onToggle={onToggle}
          onCollapseAll={vi.fn()}
          countLabel="3 Items"
          addLabel="Add Item"
          onAdd={vi.fn()}
          onRemove={vi.fn()}
        />
      )
      const itemLabel = screen.getByText("Item 1")
      fireEvent.click(itemLabel)
      expect(onToggle).toHaveBeenCalledWith("item-1")
    })

    it("should show expanded item content", () => {
      render(
        <UniversalRepeaterInspector<TestItem>
          items={mockItems}
          getItemId={(item) => item.id}
          getItemLabel={(item) => item.label}
          renderContent={(item) => <div data-testid={`content-${item.id}`}>{item.label} content</div>}
          expandedId="item-1"
          onToggle={vi.fn()}
          onCollapseAll={vi.fn()}
          countLabel="3 Items"
          addLabel="Add Item"
          onAdd={vi.fn()}
          onRemove={vi.fn()}
        />
      )
      expect(screen.getByTestId("content-item-1")).toBeInTheDocument()
      expect(screen.getByText("Item 1 content")).toBeInTheDocument()
    })
  })

  describe("Add Action", () => {
    it("should render add button", () => {
      render(
        <UniversalRepeaterInspector<TestItem>
          items={mockItems}
          getItemId={(item) => item.id}
          getItemLabel={(item) => item.label}
          renderContent={() => <div>content</div>}
          expandedId={null}
          onToggle={vi.fn()}
          onCollapseAll={vi.fn()}
          countLabel="3 Items"
          addLabel="Add Item"
          onAdd={vi.fn()}
          onRemove={vi.fn()}
        />
      )
      expect(screen.getByText("Add Item")).toBeInTheDocument()
    })

    it("should call onAdd when add button is clicked", () => {
      const onAdd = vi.fn()
      render(
        <UniversalRepeaterInspector<TestItem>
          items={mockItems}
          getItemId={(item) => item.id}
          getItemLabel={(item) => item.label}
          renderContent={() => <div>content</div>}
          expandedId={null}
          onToggle={vi.fn()}
          onCollapseAll={vi.fn()}
          countLabel="3 Items"
          addLabel="Add Item"
          onAdd={onAdd}
          onRemove={vi.fn()}
        />
      )
      const addButton = screen.getByText("Add Item")
      fireEvent.click(addButton)
      expect(onAdd).toHaveBeenCalled()
    })

    it("should disable add button when maxItems reached", () => {
      render(
        <UniversalRepeaterInspector<TestItem>
          items={mockItems}
          getItemId={(item) => item.id}
          getItemLabel={(item) => item.label}
          renderContent={() => <div>content</div>}
          expandedId={null}
          onToggle={vi.fn()}
          onCollapseAll={vi.fn()}
          countLabel="3 Items"
          addLabel="Add Item"
          onAdd={vi.fn()}
          onRemove={vi.fn()}
          maxItems={3}
        />
      )
      const addButton = screen.getByText("Add Item") as HTMLButtonElement
      expect(addButton.disabled).toBe(true)
    })
  })

  describe("Remove Action", () => {
    it("should render remove buttons", () => {
      render(
        <UniversalRepeaterInspector<TestItem>
          items={mockItems}
          getItemId={(item) => item.id}
          getItemLabel={(item) => item.label}
          renderContent={() => <div>content</div>}
          expandedId={null}
          onToggle={vi.fn()}
          onCollapseAll={vi.fn()}
          countLabel="3 Items"
          addLabel="Add Item"
          onAdd={vi.fn()}
          onRemove={vi.fn()}
        />
      )
      const buttons = screen.getAllByTitle("Löschen")
      expect(buttons.length).toBe(3)
    })

    it("should call onRemove with correct item id", () => {
      const onRemove = vi.fn()
      render(
        <UniversalRepeaterInspector<TestItem>
          items={mockItems}
          getItemId={(item) => item.id}
          getItemLabel={(item) => item.label}
          renderContent={() => <div>content</div>}
          expandedId={null}
          onToggle={vi.fn()}
          onCollapseAll={vi.fn()}
          countLabel="3 Items"
          addLabel="Add Item"
          onAdd={vi.fn()}
          onRemove={onRemove}
        />
      )
      const removeButtons = screen.getAllByTitle("Löschen")
      fireEvent.click(removeButtons[1]!)
      expect(onRemove).toHaveBeenCalledWith("item-2")
    })

    it("should disable remove when minItems reached", () => {
      render(
        <UniversalRepeaterInspector<TestItem>
          items={mockItems}
          getItemId={(item) => item.id}
          getItemLabel={(item) => item.label}
          renderContent={() => <div>content</div>}
          expandedId={null}
          onToggle={vi.fn()}
          onCollapseAll={vi.fn()}
          countLabel="3 Items"
          addLabel="Add Item"
          onAdd={vi.fn()}
          onRemove={vi.fn()}
          minItems={3}
        />
      )
      const removeButtons = screen.getAllByTitle("Löschen")
      expect((removeButtons[0] as HTMLButtonElement).disabled).toBe(true)
    })
  })

  describe("Move Actions", () => {
    it("should render move up button for non-first items", () => {
      render(
        <UniversalRepeaterInspector<TestItem>
          items={mockItems}
          getItemId={(item) => item.id}
          getItemLabel={(item) => item.label}
          renderContent={() => <div>content</div>}
          expandedId={null}
          onToggle={vi.fn()}
          onCollapseAll={vi.fn()}
          countLabel="3 Items"
          addLabel="Add Item"
          onAdd={vi.fn()}
          onRemove={vi.fn()}
          showMoveButtons={true}
        />
      )
      const upButtons = screen.getAllByTitle("Nach oben")
      expect(upButtons.length).toBeGreaterThan(0)
    })

    it("should render move down button for non-last items", () => {
      render(
        <UniversalRepeaterInspector<TestItem>
          items={mockItems}
          getItemId={(item) => item.id}
          getItemLabel={(item) => item.label}
          renderContent={() => <div>content</div>}
          expandedId={null}
          onToggle={vi.fn()}
          onCollapseAll={vi.fn()}
          countLabel="3 Items"
          addLabel="Add Item"
          onAdd={vi.fn()}
          onRemove={vi.fn()}
          showMoveButtons={true}
        />
      )
      const downButtons = screen.getAllByTitle("Nach unten")
      expect(downButtons.length).toBeGreaterThan(0)
    })

    it("should call onMove with correct indices", () => {
      const onMove = vi.fn()
      render(
        <UniversalRepeaterInspector<TestItem>
          items={mockItems}
          getItemId={(item) => item.id}
          getItemLabel={(item) => item.label}
          renderContent={() => <div>content</div>}
          expandedId={null}
          onToggle={vi.fn()}
          onCollapseAll={vi.fn()}
          countLabel="3 Items"
          addLabel="Add Item"
          onAdd={vi.fn()}
          onRemove={vi.fn()}
          onMove={onMove}
          showMoveButtons={true}
        />
      )
      const upButtons = screen.getAllByTitle("Nach oben")
      fireEvent.click(upButtons[1]!)
      expect(onMove).toHaveBeenCalledWith(1, 0)
    })

    it("should disable move up for first item", () => {
      render(
        <UniversalRepeaterInspector<TestItem>
          items={mockItems}
          getItemId={(item) => item.id}
          getItemLabel={(item) => item.label}
          renderContent={() => <div>content</div>}
          expandedId={null}
          onToggle={vi.fn()}
          onCollapseAll={vi.fn()}
          countLabel="3 Items"
          addLabel="Add Item"
          onAdd={vi.fn()}
          onRemove={vi.fn()}
          showMoveButtons={true}
        />
      )
      const upButtons = screen.getAllByTitle("Nach oben")
      expect((upButtons[0] as HTMLButtonElement).disabled).toBe(true)
    })

    it("should disable move down for last item", () => {
      render(
        <UniversalRepeaterInspector<TestItem>
          items={mockItems}
          getItemId={(item) => item.id}
          getItemLabel={(item) => item.label}
          renderContent={() => <div>content</div>}
          expandedId={null}
          onToggle={vi.fn()}
          onCollapseAll={vi.fn()}
          countLabel="3 Items"
          addLabel="Add Item"
          onAdd={vi.fn()}
          onRemove={vi.fn()}
          showMoveButtons={true}
        />
      )
      const downButtons = screen.getAllByTitle("Nach unten")
      expect((downButtons[downButtons.length - 1] as HTMLButtonElement).disabled).toBe(true)
    })
  })
})
