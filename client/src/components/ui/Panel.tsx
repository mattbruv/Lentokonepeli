import { ReactNode } from "react";
import classes from "./Panel.module.css";

type PanelProps = {
    title?: ReactNode;
    icon?: ReactNode;
    children: ReactNode;
    className?: string;
    bodyClassName?: string;
    pop?: boolean;
};

export function Panel({ title, icon, children, className, bodyClassName, pop }: PanelProps) {
    return (
        <section className={[classes.panel, pop ? classes.pop : "", className ?? ""].join(" ")}>
            {title && (
                <h2 className={classes.title}>
                    {icon && <span className={classes.icon}>{icon}</span>}
                    <span>{title}</span>
                </h2>
            )}
            <div className={[classes.body, bodyClassName ?? ""].join(" ")}>{children}</div>
        </section>
    );
}
