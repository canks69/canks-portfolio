export const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

export const qs = <T extends HTMLElement = HTMLElement>(sel: string, root: ParentNode = document) =>
	root.querySelector<T>(sel);

export const qsa = <T extends HTMLElement = HTMLElement>(sel: string, root: ParentNode = document) =>
	Array.from(root.querySelectorAll<T>(sel));

/** Kurva easing yang sama dengan --ease-out di CSS (untuk Motion). */
export const easeOut = [0.16, 1, 0.3, 1] as const;
export const easeInOut = [0.76, 0, 0.24, 1] as const;
