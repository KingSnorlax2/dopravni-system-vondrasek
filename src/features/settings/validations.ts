import { z } from 'zod'

export const systemSettingsSchema = z.object({
  maintenanceMode: z.boolean().default(false),
  defaultPageSize: z.coerce
    .number()
    .min(5, 'Minimálně 5 položek')
    .max(100, 'Maximálně 100 položek')
    .default(10),
  stkWarningDays: z.coerce
    .number()
    .min(1, 'Minimálně 1 den')
    .max(90, 'Maximálně 90 dní')
    .default(30),
  smtpHost: z.string().max(255).default(''),
  allowDriverLogin: z.boolean().default(true),
})

export type SystemSettings = z.infer<typeof systemSettingsSchema>
