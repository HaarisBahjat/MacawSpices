const { prisma } = require('../src/lib/prisma');

const spiceCategories = [
  { name: 'Whole Spices', slug: 'whole-spices', imageUrl: '/images/spices/blackpepper.webp' },
  { name: 'Ground Spices', slug: 'ground-spices', imageUrl: '/images/spices/cinnamon-sticks.jpg' },
  { name: 'Spice Blends', slug: 'spice-blends', imageUrl: '/images/macaw_product_banner.png' },
  { name: 'Seeds & Pods', slug: 'seeds-pods', imageUrl: '/images/spices/green-cardamom.jpg' },
];

async function main() {
  console.log('🌶️  Seeding MacawSpice database...');

  // Clean up existing data across all dependent tables to remove arbitrary products and duplicates safely
  try {
    await prisma.cartItem.deleteMany({});
    await prisma.wishlistItem.deleteMany({});
    await prisma.orderItem.deleteMany({});
    await prisma.review.deleteMany({});
    await prisma.savedBlend.deleteMany({});
    await prisma.blendItem.deleteMany({});
    await prisma.blendTemplate.deleteMany({});
    await prisma.product.deleteMany({});
  } catch (e) {
    console.log('Note during initial cleanup:', e.message);
  }

  // Seed categories
  const categories = {};
  for (const cat of spiceCategories) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
    categories[cat.slug] = created;
    console.log(`✅ Category: ${cat.name}`);
  }

  // Seed products from 13.pdf
  const products = [
    {
      name: 'Black Pepper (काली मिर्च)',
      slug: 'black-pepper',
      description: 'High quality black pepper, known as the King of Spices.',
      categoryId: categories['whole-spices'].id,
      pricePerGram: 0.75,
      stock: 32000,
      minOrderGram: 50,
      images: ['/images/spices/blackpepper.webp'],
      featured: true,
      flavorProfile: 'Sharp, Pungent, Bold',
      origin: 'India',
    },
    {
      name: 'Black Cardamom (बड़ी इलाइची)',
      slug: 'black-cardamom',
      description: 'Smoky, camphor-like large cardamom pods.',
      categoryId: categories['seeds-pods'].id,
      pricePerGram: 1.20,
      stock: 24000,
      minOrderGram: 50,
      images: ['/images/spices/blackcardamom.webp'],
      featured: true,
      flavorProfile: 'Smoky, Intense',
      origin: 'India',
    },
    {
      name: 'Caraway Seeds (शाह जीरा)',
      slug: 'caraway-seeds',
      description: 'Highly aromatic caraway seeds.',
      categoryId: categories['whole-spices'].id,
      pricePerGram: 0.80,
      stock: 24000,
      minOrderGram: 50,
      images: ['/images/spices/caraway-seeds.webp'],
      featured: false,
      flavorProfile: 'Earthy, Nutty',
      origin: 'India',
    },
    {
      name: 'Cinnamon Sticks (दालचीनी)',
      slug: 'cinnamon-sticks',
      description: 'Sweet and warm cinnamon sticks.',
      categoryId: categories['whole-spices'].id,
      pricePerGram: 0.90,
      stock: 20000,
      minOrderGram: 50,
      images: ['/images/spices/cinnamon-sticks.jpg'],
      featured: false,
      flavorProfile: 'Sweet, Warm',
      origin: 'India',
    },
    {
      name: 'Bay Leaves (तेज पत्ता)',
      slug: 'bay-leaves',
      description: 'Aromatic bay leaves for curries and rice.',
      categoryId: categories['whole-spices'].id,
      pricePerGram: 0.50,
      stock: 16000,
      minOrderGram: 50,
      images: ['/images/spices/bay-leaf.webp'],
      featured: false,
      flavorProfile: 'Herbal, Floral',
      origin: 'India',
    },
    {
      name: 'Star Anise (चक्र फूल)',
      slug: 'star-anise',
      description: 'Beautiful and licorice-flavored star anise.',
      categoryId: categories['whole-spices'].id,
      pricePerGram: 1.50,
      stock: 16000,
      minOrderGram: 50,
      images: ['/images/spices/star-anise.webp'],
      featured: true,
      flavorProfile: 'Licorice, Sweet',
      origin: 'India',
    },
    {
      name: 'Green Cardamom (छोटी इलाइची)',
      slug: 'green-cardamom',
      description: 'Aromatic elaichi pods.',
      categoryId: categories['seeds-pods'].id,
      pricePerGram: 2.50,
      stock: 16000,
      minOrderGram: 50,
      images: ['/images/spices/green-cardamom.jpg'],
      featured: true,
      flavorProfile: 'Floral, Sweet',
      origin: 'India',
    },
    {
      name: 'Cloves (लौंग)',
      slug: 'cloves',
      description: 'Strong, pungent, and sweet cloves.',
      categoryId: categories['whole-spices'].id,
      pricePerGram: 1.80,
      stock: 12000,
      minOrderGram: 50,
      images: ['/images/spices/cloves.webp'],
      featured: false,
      flavorProfile: 'Pungent, Sweet',
      origin: 'India',
    },
    {
      name: 'Mace (जावित्री)',
      slug: 'mace',
      description: 'Delicate and sweet mace.',
      categoryId: categories['whole-spices'].id,
      pricePerGram: 3.00,
      stock: 12000,
      minOrderGram: 50,
      images: ['/images/spices/mace.webp'],
      featured: false,
      flavorProfile: 'Sweet, Spicy',
      origin: 'India',
    },
    {
      name: 'Stone Flower (दगड़ फूल)',
      slug: 'stone-flower',
      description: 'Unique earthy spice for authentic curries.',
      categoryId: categories['whole-spices'].id,
      pricePerGram: 2.00,
      stock: 12000,
      minOrderGram: 50,
      images: ['/images/spices/stone-flower.jpg'],
      featured: false,
      flavorProfile: 'Earthy, Woody',
      origin: 'India',
    },
    {
      name: 'White Pepper (सफ़ेद मिर्च)',
      slug: 'white-pepper',
      description: 'Mild and earthy white pepper.',
      categoryId: categories['whole-spices'].id,
      pricePerGram: 1.00,
      stock: 8000,
      minOrderGram: 50,
      images: ['/images/spices/whitepepper.webp'],
      featured: false,
      flavorProfile: 'Mild, Earthy',
      origin: 'India',
    },
    {
      name: 'Nutmeg (जायफल)',
      slug: 'nutmeg',
      description: 'Warm and sweet nutmeg.',
      categoryId: categories['whole-spices'].id,
      pricePerGram: 2.20,
      stock: 6000,
      minOrderGram: 50,
      images: ['/images/spices/nutmeg.jpg'],
      featured: false,
      flavorProfile: 'Warm, Sweet',
      origin: 'India',
    },
    {
      name: 'Cubeb Pepper (कबाब चीनी)',
      slug: 'cubeb-pepper',
      description: 'Aromatic and slightly bitter cubeb pepper.',
      categoryId: categories['whole-spices'].id,
      pricePerGram: 1.50,
      stock: 2000,
      minOrderGram: 50,
      images: ['/images/spices/cubeb-pepper.webp'],
      featured: false,
      flavorProfile: 'Peppery, Bitter',
      origin: 'India',
    },
  ];

  const createdProducts = {};
  for (const product of products) {
    const created = await prisma.product.upsert({
      where: { slug: product.slug },
      update: product,
      create: product,
    });
    createdProducts[product.slug] = created;
    console.log(`✅ Product: ${product.name}`);
  }

  // Ensure ONLY the original 13 products remain in the database (clean up any extras)
  const originalSlugs = products.map((p) => p.slug);
  await prisma.product.deleteMany({
    where: {
      slug: { notIn: originalSlugs },
    },
  });

  // Seed blend templates
  const blendTemplates = [
    {
      name: 'MACAW Blend (50g)',
      slug: 'macaw-blend-50g',
      description: 'The signature MACAW blend with 13 premium spices.',
      imageUrl: '/images/macaw_product_banner.png',
      tags: ['macaw', 'signature', 'premium'],
      items: [
        { slug: 'black-pepper', weightGrams: 8 },
        { slug: 'black-cardamom', weightGrams: 6 },
        { slug: 'caraway-seeds', weightGrams: 6 },
        { slug: 'cinnamon-sticks', weightGrams: 5 },
        { slug: 'bay-leaves', weightGrams: 4 },
        { slug: 'star-anise', weightGrams: 4 },
        { slug: 'green-cardamom', weightGrams: 4 },
        { slug: 'cloves', weightGrams: 3 },
        { slug: 'mace', weightGrams: 3 },
        { slug: 'stone-flower', weightGrams: 3 },
        { slug: 'white-pepper', weightGrams: 2 },
        { slug: 'nutmeg', weightGrams: 1.5 },
        { slug: 'cubeb-pepper', weightGrams: 0.5 },
      ]
    }
  ];

  for (const template of blendTemplates) {
    const { items, ...data } = template;
    // Delete if already exists to refresh its items
    const existing = await prisma.blendTemplate.findUnique({ where: { slug: data.slug } });
    if (existing) {
      await prisma.blendItem.deleteMany({ where: { blendTemplateId: existing.id } });
      await prisma.blendTemplate.delete({ where: { id: existing.id } });
    }
    const created = await prisma.blendTemplate.create({
      data: {
        ...data,
        items: {
          create: items.map((i) => ({
            productId: createdProducts[i.slug].id,
            weightGrams: i.weightGrams,
          }))
        }
      }
    });
    console.log(`✅ Blend Template: ${created.name}`);
  }

  console.log('\n🎉 Seed complete!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
