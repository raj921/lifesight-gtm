import { Button as Base } from "@base-ui/react/button";

const STYLE = {
  default: "bg-fg text-container hover:opacity-85",
  subtle: "bg-component text-fg hover:bg-component-hover active:bg-component-active",
  ghost: "text-fg2 hover:bg-component-hover hover:text-fg",
  hot: "bg-hot text-white hover:opacity-90",
};

export function Button({ variant = "subtle", className = "", ...props }: Base.Props & { variant?: keyof typeof STYLE }) {
  return (
    <Base
      className={`inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-40 ${STYLE[variant]} ${className}`}
      {...props}
    />
  );
}
