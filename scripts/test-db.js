const { PrismaClient } = require('@prisma/client')

async function main() {
  const prisma = new PrismaClient()
  try {
    console.log('Checking existing tables...')
    await prisma.$connect()

    const tables = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `
    console.log('Existing tables:', tables.map(t => t.table_name))

    // Check if Equipment table exists
    if (tables.some(t => t.table_name === 'Equipment')) {
      const columns = await prisma.$queryRaw`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'Equipment'
        ORDER BY ordinal_position
      `
      console.log('Equipment columns:', columns.map(c => c.column_name))
    }

  } catch (e) {
    console.error('Error:', e.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()
