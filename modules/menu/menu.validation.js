import * as z from 'zod';

export const createMenuSchema = z.object({
    name: z.string().min(3, { message: "Name must be at least 3 characters long" }),
    description: z.string().optional(),
    price: z.number().positive({ message: "Price must be a positive number" }),
    is_available: z.boolean().optional(),
})

export const updateMenuSchema = z.object({
    name: z.string().min(3, { message: "Name must be at least 3 characters long" }),
    description: z.string().optional(),
    price: z.number().positive({ message: "Price must be a positive number" }),
    is_available: z.boolean().optional().default(true),
})