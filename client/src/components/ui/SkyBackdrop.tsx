import { CSSProperties, memo } from "react";
import ground from "../../assets/ui/ground1.gif";
import hill from "../../assets/ui/hill1.gif";
import palm from "../../assets/ui/palmtree.gif";
import parachuter from "../../assets/ui/parachuter0.gif";
import plane5 from "../../assets/ui/plane5.gif";
import plane6 from "../../assets/ui/plane6.gif";
import plane8 from "../../assets/ui/plane8.gif";
import plane9 from "../../assets/ui/plane9.gif";
import classes from "./SkyBackdrop.module.css";

const CLOUDS = [
    { top: 8, width: 260, duration: 190, delay: -20 },
    { top: 22, width: 140, duration: 150, delay: -95 },
    { top: 38, width: 360, duration: 240, delay: -150 },
    { top: 14, width: 110, duration: 130, delay: -60 },
    { top: 55, width: 200, duration: 210, delay: -5 },
    { top: 30, width: 180, duration: 175, delay: -130 },
    { top: 4, width: 150, duration: 160, delay: -120 },
    { top: 46, width: 240, duration: 220, delay: -190 },
];

const PLANES = [
    { src: plane6, top: 18, duration: 38, delay: -6, bob: 3.2 },
    { src: plane9, top: 46, duration: 52, delay: -30, bob: 4.1 },
    { src: plane5, top: 30, duration: 64, delay: -48, bob: 3.7, reverse: true },
    { src: plane8, top: 62, duration: 46, delay: -18, bob: 2.9, reverse: true },
];

const HILLS = [
    { left: -4, scale: 1.1 },
    { left: 34, scale: 0.8 },
    { left: 70, scale: 1.25 },
];

function Cloud({ width }: { width: number }) {
    return (
        <svg className={classes.cloudSvg} width={width} viewBox="0 0 200 96" aria-hidden>
            <defs>
                <linearGradient id="lk-cloud-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0.35" stopColor="var(--lk-cloud)" />
                    <stop offset="1" stopColor="var(--lk-cloud-shade)" />
                </linearGradient>
            </defs>
            <path
                d="M14 88 C4 88 4 79 16 78 C13 66 27 59 38 65 C40 49 57 43 67 53 C70 30 95 22 106 42 C113 26 138 28 141 49 C155 42 171 53 165 68 C179 66 192 75 185 83 C195 85 195 90 185 90 Z"
                fill="url(#lk-cloud-fill)"
                stroke="var(--lk-cloud-line)"
                strokeWidth="2.5"
                strokeLinejoin="round"
            />
        </svg>
    );
}

export const SkyBackdrop = memo(function SkyBackdrop() {
    return (
        <div className={classes.sky} aria-hidden>
            <div className={classes.stars} />
            {CLOUDS.map((c, i) => (
                <div
                    key={i}
                    className={classes.cloud}
                    style={
                        {
                            top: `${c.top}%`,
                            animationDuration: `${c.duration}s`,
                            animationDelay: `${c.delay}s`,
                        } as CSSProperties
                    }
                >
                    <Cloud width={c.width} />
                </div>
            ))}
            {PLANES.map((p, i) => (
                <div
                    key={i}
                    className={[classes.flyer, p.reverse ? classes.reverse : ""].join(" ")}
                    style={{ top: `${p.top}%`, animationDuration: `${p.duration}s`, animationDelay: `${p.delay}s` }}
                >
                    <img className={classes.plane} src={p.src} style={{ animationDuration: `${p.bob}s` }} alt="" />
                </div>
            ))}
            <div className={classes.chute}>
                <img src={parachuter} alt="" />
            </div>
            <div className={classes.land}>
                {HILLS.map((h, i) => (
                    <img
                        key={i}
                        className={classes.hill}
                        src={hill}
                        style={{ left: `${h.left}%`, transform: `scale(${h.scale})` }}
                        alt=""
                    />
                ))}
                <img className={classes.palm} src={palm} alt="" />
                <div className={classes.ground} style={{ backgroundImage: `url(${ground})` }} />
            </div>
        </div>
    );
});
