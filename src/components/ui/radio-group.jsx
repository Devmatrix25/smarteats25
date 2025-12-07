import * as React from "react"
import { cn } from "@/lib/utils"

const RadioGroup = React.forwardRef(({ className, value, onValueChange, ...props }, ref) => {
    return (
        <div className={cn("grid gap-2", className)} {...props} ref={ref}>
            {React.Children.map(props.children, child => {
                return React.cloneElement(child, {
                    checked: child.props.value === value,
                    onClick: () => onValueChange(child.props.value)
                })
            })}
        </div>
    )
})
RadioGroup.displayName = "RadioGroup"

const RadioGroupItem = React.forwardRef(({ className, value, checked, onClick, ...props }, ref) => {
    return (
        <button
            type="button"
            role="radio"
            aria-checked={checked}
            data-state={checked ? "checked" : "unchecked"}
            value={value}
            className={cn(
                "aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                checked && "bg-primary text-primary-foreground",
                className
            )}
            onClick={onClick}
            ref={ref}
            {...props}
        >
            <span className={cn("flex items-center justify-center", checked ? "block" : "hidden")}>
                <div className="h-2.5 w-2.5 rounded-full bg-current" />
            </span>
        </button>
    )
})
RadioGroupItem.displayName = "RadioGroupItem"

export { RadioGroup, RadioGroupItem }
