/**
 * The site's root, where the files in /public end up.
 * The build uses `base: './'` so it works from any folder (e.g. /CO5/), but a
 * './' path resolves against the page, and the problem statements page lives
 * one level down (/ps/). Built scripts all sit in <root>/assets/, so the root is
 * found from this script's own URL instead. In dev it is simply '/'.
 */
const ROOT = import.meta.env.DEV ? import.meta.env.BASE_URL : new URL(/* @vite-ignore */ '../', import.meta.url).href;

/** Resolves a file in /public against the site root (the same from every page). */
export const asset = (path: string) => `${ROOT}${path.replace(/^\//, '')}`;
