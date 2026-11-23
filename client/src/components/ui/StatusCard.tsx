import { ReactNode } from "react";
import classes from "./StatusCard.module.css";

type StatusCardProps = {
    icon: ReactNode;
    title: ReactNode;
    children: ReactNode;
    actions?: ReactNode;
};

export function StatusCard({ icon, title, children, actions }: StatusCardProps) {
    return (
        <div className={classes.card} role="status" aria-live="polite">
            <div className={classes.icon}>{icon}</div>
            <h2 className={classes.title}>{title}</h2>
            <div className={classes.body}>{children}</div>
            {actions && <div className={classes.actions}>{actions}</div>}
        </div>
    );
}

export function StatusOverlay({ children, dim }: { children: ReactNode; dim?: boolean }) {
    return <div className={[classes.overlay, dim ? classes.dim : ""].join(" ")}>{children}</div>;
}
