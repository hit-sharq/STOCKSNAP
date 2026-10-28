import { PrismaClient } from '@prisma/client'

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://neondb_owner:npg_ag4WHsy0NzPv@ep-dark-flower-b83oijo3-pooler.c-14.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }
export const prisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
