
"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

<<<<<<< HEAD
// Define props to include indicatorClassName
interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  indicatorClassName?: string
=======
// Extend props to accept indicatorClassName
interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  indicatorClassName?: string;
>>>>>>> APIHarmony-Lite/master
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
<<<<<<< HEAD
  ProgressProps // Use the new ProgressProps
// Destructure indicatorClassName so it's not part of ...restProps
>(({ className, value, indicatorClassName, ...restProps }, ref) => (
=======
  ProgressProps // Use the extended props interface
>(({ className, value, indicatorClassName, ...props }, ref) => ( // Destructure indicatorClassName
>>>>>>> APIHarmony-Lite/master
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
      className
    )}
<<<<<<< HEAD
    {...restProps} // Spread only the remaining props
  >
    <ProgressPrimitive.Indicator
      // Apply indicatorClassName here, defaulting to original classes if not provided
      className={cn(
        "h-full w-full flex-1 bg-primary transition-all",
        indicatorClassName
      )}
=======
    {...props} // Pass remaining props (excluding indicatorClassName) to the Root
  >
    <ProgressPrimitive.Indicator
      className={cn("h-full w-full flex-1 bg-primary transition-all", indicatorClassName)} // Apply indicatorClassName here
>>>>>>> APIHarmony-Lite/master
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
