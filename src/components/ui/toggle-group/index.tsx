'use client'

import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../utils";

const toggleVariants = cva(
  "inline-flex items-center justify-center gap-1 rounded-lg text-sm font-medium whitespace-nowrap transition-all outline-none hover:bg-muted hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline: "border border-input bg-transparent hover:bg-muted"
      },
      size: {
        default: "h-8 min-w-8 px-2",
        sm: "h-7 min-w-7 rounded-md px-1.5 text-[0.8rem]",
        lg: "h-9 min-w-9 px-2.5"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

interface ToggleProps extends
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof toggleVariants> {
  pressed?: boolean;
  defaultPressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
}

const Toggle = React.forwardRef<HTMLButtonElement, ToggleProps>(
  ({ className, variant = "default", size = "default", pressed, defaultPressed = false, onPressedChange, ...props }, ref) => {
    const [isPressed, setIsPressed] = React.useState(defaultPressed);
    const controlledPressed = pressed !== undefined ? pressed : isPressed;

    const handleClick = () => {
      const newPressed = !controlledPressed;
      if (pressed === undefined) setIsPressed(newPressed);
      onPressedChange?.(newPressed);
    };

    return (
      <button
        ref={ref}
        type="button"
        data-slot="toggle"
        aria-pressed={controlledPressed}
        data-state={controlledPressed ? "on" : "off"}
        onClick={handleClick}
        className={cn(
          toggleVariants({ variant, size }),
          controlledPressed && "bg-muted",
          className
        )}
        {...props} />);
  }
);
Toggle.displayName = "Toggle";

interface ToggleGroupContextType {
  value: string[];
  onValueChange: (value: string) => void;
  variant?: VariantProps<typeof toggleVariants>["variant"];
  size?: VariantProps<typeof toggleVariants>["size"];
}

const ToggleGroupContext = React.createContext<ToggleGroupContextType>({
  value: [],
  onValueChange: () => {}
});

interface ToggleGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: "single" | "multiple";
  value?: string | string[];
  defaultValue?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  variant?: VariantProps<typeof toggleVariants>["variant"];
  size?: VariantProps<typeof toggleVariants>["size"];
}

const ToggleGroup = React.forwardRef<HTMLDivElement, ToggleGroupProps>(
  ({ className, type = "single", value, defaultValue, onValueChange, variant, size, children, ...props }, ref) => {
    const [internalValue, setInternalValue] = React.useState<string[]>(
      defaultValue ? Array.isArray(defaultValue) ? defaultValue : [defaultValue] : []
    );
    const controlledValue = value !== undefined ?
    Array.isArray(value) ? value : [value] :
    internalValue;

    const handleChange = (itemValue: string) => {
      let newValue: string[];
      if (type === "single") {
        newValue = controlledValue.includes(itemValue) ? [] : [itemValue];
      } else {
        newValue = controlledValue.includes(itemValue) ?
        controlledValue.filter((v) => v !== itemValue) :
        [...controlledValue, itemValue];
      }
      if (value === undefined) setInternalValue(newValue);
      onValueChange?.(type === "single" ? newValue[0] ?? "" : newValue);
    };

    return (
      <ToggleGroupContext.Provider value={{ value: controlledValue, onValueChange: handleChange, variant, size }}>
        <div
          ref={ref}
          data-slot="toggle-group"
          role="group"
          className={cn("flex w-fit flex-row items-center gap-0 rounded-lg", className)}
          {...props}>

          {children}
        </div>
      </ToggleGroupContext.Provider>);
  }
);
ToggleGroup.displayName = "ToggleGroup";

interface ToggleGroupItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

const ToggleGroupItem = React.forwardRef<HTMLButtonElement, ToggleGroupItemProps>(
  ({ className, value: itemValue, ...props }, ref) => {
    const context = React.useContext(ToggleGroupContext);
    const isActive = context.value.includes(itemValue);

    return (
      <button
        ref={ref}
        type="button"
        data-slot="toggle-group-item"
        aria-pressed={isActive}
        data-state={isActive ? "on" : "off"}
        onClick={() => context.onValueChange(itemValue)}
        className={cn(
          toggleVariants({ variant: context.variant, size: context.size }),
          "shrink-0 rounded-none first:rounded-l-lg last:rounded-r-lg",
          isActive && "bg-muted",
          className
        )}
        {...props} />);
  }
);
ToggleGroupItem.displayName = "ToggleGroupItem";

export { Toggle, ToggleGroup, ToggleGroupItem, toggleVariants };
