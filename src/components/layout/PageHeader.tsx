import { forwardRef, ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export const PageHeader = forwardRef<HTMLElement, PageHeaderProps>(
  function PageHeader({ title, description, actions }, ref) {
    return (
      <header ref={ref} className="flex items-center justify-between mb-6 opacity-0 animate-fade-in" style={{ animationFillMode: "forwards" }}>
        <div>
          <h1 className="text-xl font-bold mb-0.5">{title}</h1>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </header>
    );
  }
);
