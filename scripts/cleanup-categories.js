const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function cleanupCategories() {
  try {
    // Delete categories with IDs 13, 15, and 16
    await prisma.kategorie.deleteMany({
      where: {
        id: {
          in: [32, 31, 30]
        }
      }
    });
    
    console.log('Categories deleted successfully');
  } catch (error) {
    console.error('Error deleting categories:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupCategories(); 