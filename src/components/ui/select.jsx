import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

const Select = ({ children, value, onValueChange, defaultValue }) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const [selectedValue, setSelectedValue] = React.useState(value || defaultValue || '')
  const selectRef = React.useRef(null)

  // Close on outside click
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Sync with external value
  React.useEffect(() => {
    if (value !== undefined) setSelectedValue(value)
  }, [value])

  const handleSelect = (val) => {
    setSelectedValue(val)
    setIsOpen(false)
    if (onValueChange) onValueChange(val)
  }

  return (
    <div ref={selectRef} className="relative">
      {React.Children.map(children, child =>
        React.cloneElement(child, {
          isOpen,
          setIsOpen,
          selectedValue,
          onSelect: handleSelect
        })
      )}
    </div>
  )
}

const SelectTrigger = React.forwardRef(({ className, children, isOpen, setIsOpen, selectedValue, ...props }, ref) => (
  <button
    ref={ref}
    type="button"
    onClick={() => setIsOpen && setIsOpen(!isOpen)}
    className={cn(
      "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  >
    {React.Children.map(children, child =>
      React.isValidElement(child) ? React.cloneElement(child, { selectedValue }) : child
    )}
    <ChevronDown className={cn("h-4 w-4 opacity-50 transition-transform", isOpen && "rotate-180")} />
  </button>
))
SelectTrigger.displayName = "SelectTrigger"

const SelectContent = React.forwardRef(({ className, children, isOpen, onSelect, ...props }, ref) => {
  if (!isOpen) return null

  return (
    <div
      ref={ref}
      className={cn(
        "absolute z-50 min-w-[8rem] w-full overflow-hidden rounded-md border bg-white text-popover-foreground shadow-lg mt-1 py-1 animate-in fade-in-0 zoom-in-95",
        className
      )}
      {...props}
    >
      {React.Children.map(children, child =>
        React.isValidElement(child) ? React.cloneElement(child, { onSelect }) : child
      )}
    </div>
  )
})
SelectContent.displayName = "SelectContent"

const SelectItem = React.forwardRef(({ className, children, value, onSelect, ...props }, ref) => (
  <div
    ref={ref}
    onClick={() => onSelect && onSelect(value)}
    className={cn(
      "relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 px-3 text-sm outline-none hover:bg-orange-50 hover:text-orange-600 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    {children}
  </div>
))
SelectItem.displayName = "SelectItem"

const SelectValue = ({ placeholder, selectedValue, children }) => {
  // Find matching child content for selected value
  return <span className="truncate">{selectedValue || placeholder || 'Select...'}</span>
}

export { Select, SelectTrigger, SelectContent, SelectItem, SelectValue }
