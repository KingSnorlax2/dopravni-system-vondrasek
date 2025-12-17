import { z } from "zod"

/**
 * Login form validation schema
 * Used for client-side form validation and server-side validation
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email je povinný")
    .email("Neplatný formát emailu"),
  password: z
    .string()
    .min(1, "Heslo je povinné")
    .min(6, "Heslo musí mít minimálně 6 znaků"),
})

export type LoginFormData = z.infer<typeof loginSchema>

/**
 * Registration form validation schema (if needed)
 */
export const registerSchema = z.object({
  email: z
    .string()
    .min(1, "Email je povinný")
    .email("Neplatný formát emailu"),
  password: z
    .string()
    .min(6, "Heslo musí mít minimálně 6 znaků")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Heslo musí obsahovat malé písmeno, velké písmeno a číslici"
    ),
  confirmPassword: z.string().min(1, "Potvrzení hesla je povinné"),
  jmeno: z.string().min(1, "Jméno je povinné").max(100, "Jméno je příliš dlouhé"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Hesla se neshodují",
  path: ["confirmPassword"],
})

export type RegisterFormData = z.infer<typeof registerSchema>

/**
 * Change password validation schema
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Současné heslo je povinné"),
  newPassword: z
    .string()
    .min(6, "Nové heslo musí mít minimálně 6 znaků")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Heslo musí obsahovat malé písmeno, velké písmeno a číslici"
    ),
  confirmPassword: z.string().min(1, "Potvrzení hesla je povinné"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Hesla se neshodují",
  path: ["confirmPassword"],
})

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>


