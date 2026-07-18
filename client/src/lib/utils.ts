import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
export const money = (value: number) => value === 0 ? "Free" : `$${value}/mo`;
export const date = (value: string | Date) => new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value));
