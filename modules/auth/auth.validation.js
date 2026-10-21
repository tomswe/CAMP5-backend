import { z } from "zod";

export const signupSchema = z.object({
    name: z.string({ error: "Name is required" })
        .min(3, { error: "Name must be at least 3 characters" })
        .max(225, { error: "Name must be at most 225 characters" }),
    email: z.email({ error: "Please enter a valid email address" }),
    password: z.string({ error: "Password is required" })
        .min(6, { error: "Password must be at least 6 characters" }),
});

export const signinSchema = z.object({
    email: z.email({ error: "Please enter a valid email address" }),
    password: z.string({ error: "Password is required" })
        .min(6, { error: "Password must be at least 6 characters" }),
});

export const updateMeSchema = z.object({
    name: z.string({ error: "Name is required" })
        .min(3, { error: "Name must be at least 3 characters" })
        .max(225, { error: "Name must be at most 225 characters" }),
    email: z.email({ error: "Please enter a valid email address" }).optional(),
    password: z.string({ error: "Password must be a string" })
        .min(6, { error: "Password must be at least 6 characters" }).optional(),
});