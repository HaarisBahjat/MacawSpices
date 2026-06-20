const { prisma } = require('../src/lib/prisma');

const spiceCategories = [
  { name: 'Whole Spices', slug: 'whole-spices', imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400' },
  { name: 'Ground Spices', slug: 'ground-spices', imageUrl: 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=400' },
  { name: 'Spice Blends', slug: 'spice-blends', imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400' },
  { name: 'Seeds & Pods', slug: 'seeds-pods', imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400' },
];

async function main() {
  console.log('🌶️  Seeding MacawSpice database...');

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

  // Seed products
  const products = [
    {
      name: 'Kashmiri Red Chilli',
      slug: 'kashmiri-red-chilli',
      description: 'Vibrant red chilli from the valleys of Kashmir. Mild heat with beautiful color.',
      categoryId: categories['whole-spices'].id,
      pricePerGram: 0.85,
      stock: 5000,
      minOrderGram: 50,
      images: ['https://images.unsplash.com/photo-1583119022894-919a68a3d0e3?w=600'],
      featured: true,
      flavorProfile: 'Mild, Smoky, Rich Color',
      origin: 'Kashmir, India',
    },
    {
      name: 'Turmeric Powder',
      slug: 'turmeric-powder',
      description: 'Premium Lakadong turmeric from Meghalaya. High curcumin content.',
      categoryId: categories['ground-spices'].id,
      pricePerGram: 0.65,
      stock: 8000,
      minOrderGram: 100,
      images: ['https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=600'],
      featured: true,
      flavorProfile: 'Earthy, Warm, Slightly Bitter',
      origin: 'Meghalaya, India',
    },
    {
      name: 'Black Cardamom',
      slug: 'black-cardamom',
      description: 'Smoky, camphor-like large cardamom pods. Essential for biryanis and curries.',
      categoryId: categories['seeds-pods'].id,
      pricePerGram: 1.20,
      stock: 3000,
      minOrderGram: 50,
      images: ['https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=600'],
      featured: false,
      flavorProfile: 'Smoky, Camphor, Intense',
      origin: 'Himachal Pradesh, India',
    },
    {
      name: 'Coriander Seeds',
      slug: 'coriander-seeds',
      description: 'Fresh, citrusy coriander seeds. Base of most Indian spice mixes.',
      categoryId: categories['whole-spices'].id,
      pricePerGram: 0.35,
      stock: 10000,
      minOrderGram: 100,
      images: ['https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600'],
      featured: false,
      flavorProfile: 'Citrusy, Nutty, Mild',
      origin: 'Rajasthan, India',
    },
    {
      name: 'Cumin Seeds',
      slug: 'cumin-seeds',
      description: 'Earthy jeera from Rajasthan. Perfect for tempering and spice blends.',
      categoryId: categories['whole-spices'].id,
      pricePerGram: 0.45,
      stock: 9000,
      minOrderGram: 50,
      images: ['https://images.unsplash.com/photo-1606946887360-f5e9b59acdb2?w=600'],
      featured: true,
      flavorProfile: 'Earthy, Warm, Nutty',
      origin: 'Rajasthan, India',
    },
    {
      name: 'Green Cardamom',
      slug: 'green-cardamom',
      description: 'Aromatic elaichi pods. Queen of spices, perfect for chai and desserts.',
      categoryId: categories['seeds-pods'].id,
      pricePerGram: 2.50,
      stock: 2000,
      minOrderGram: 25,
      images: ['https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600'],
      featured: true,
      flavorProfile: 'Floral, Sweet, Aromatic',
      origin: 'Kerala, India',
    },
    {
      name: 'Garam Masala',
      slug: 'garam-masala',
      description: 'Our signature house blend of warming spices. Pre-ground and ready to use.',
      categoryId: categories['spice-blends'].id,
      pricePerGram: 0.90,
      stock: 4000,
      minOrderGram: 50,
      images: ['https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600'],
      featured: true,
      flavorProfile: 'Warm, Complex, Aromatic',
      origin: 'North India',
    },
    {
      name: 'Black Pepper',
      slug: 'black-pepper',
      description: 'Malabar black pepper, the King of Spices. Bold heat and complex aroma.',
      categoryId: categories['whole-spices'].id,
      pricePerGram: 0.75,
      stock: 7000,
      minOrderGram: 50,
      images: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600'],
      featured: false,
      flavorProfile: 'Sharp, Pungent, Bold',
      origin: 'Kerala, India',
    },
  ];

  const createdProducts = {};
  for (const product of products) {
    const created = await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: product,
    });
    createdProducts[product.slug] = created;
    console.log(`✅ Product: ${product.name}`);
  }

  // Seed blend templates
  const blendTemplates = [
    {
      name: 'Classic Garam Masala',
      slug: 'classic-garam-masala',
      description: 'The timeless North Indian warming blend. Perfect for curries and gravies.',
      imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600',
      tags: ['popular', 'north-indian', 'everyday'],
      items: [
        { slug: 'coriander-seeds', weightGrams: 100 },
        { slug: 'cumin-seeds', weightGrams: 50 },
        { slug: 'black-pepper', weightGrams: 30 },
        { slug: 'black-cardamom', weightGrams: 20 },
        { slug: 'green-cardamom', weightGrams: 10 },
      ]
    },
    {
      name: 'Kerala Spice Blend',
      slug: 'kerala-spice-blend',
      description: 'Aromatic blend from God\'s Own Country. Rich with cardamom and pepper.',
      imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600',
      tags: ['south-indian', 'aromatic', 'premium'],
      items: [
        { slug: 'green-cardamom', weightGrams: 30 },
        { slug: 'black-pepper', weightGrams: 50 },
        { slug: 'coriander-seeds', weightGrams: 70 },
        { slug: 'cumin-seeds', weightGrams: 30 },
      ]
    },
    {
      name: 'Biryani Masala',
      slug: 'biryani-masala',
      description: 'The royal blend for the king of dishes. Fragrant, layered, and complex.',
      imageUrl: 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=600',
      tags: ['biryani', 'special-occasion', 'premium'],
      items: [
        { slug: 'black-cardamom', weightGrams: 30 },
        { slug: 'green-cardamom', weightGrams: 15 },
        { slug: 'black-pepper', weightGrams: 20 },
        { slug: 'coriander-seeds', weightGrams: 60 },
        { slug: 'cumin-seeds', weightGrams: 40 },
        { slug: 'kashmiri-red-chilli', weightGrams: 25 },
      ]
    },
    {
      name: 'Golden Turmeric Mix',
      slug: 'golden-turmeric-mix',
      description: 'The perfect immunity-boosting blend for Golden Milk or Haldi Doodh.',
      imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600',
      tags: ['immunity', 'health', 'beverage'],
      items: [
        { slug: 'turmeric-powder', weightGrams: 100 },
        { slug: 'black-pepper', weightGrams: 15 },
        { slug: 'green-cardamom', weightGrams: 20 },
      ]
    },
    {
      name: 'Everyday Curry Powder',
      slug: 'everyday-curry-powder',
      description: 'A versatile, well-balanced base for your daily dal and sabzi.',
      imageUrl: 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=600',
      tags: ['everyday', 'essential', 'mild'],
      items: [
        { slug: 'coriander-seeds', weightGrams: 80 },
        { slug: 'cumin-seeds', weightGrams: 40 },
        { slug: 'turmeric-powder', weightGrams: 30 },
        { slug: 'kashmiri-red-chilli', weightGrams: 20 },
      ]
    },
  ];

  for (const template of blendTemplates) {
    const { items, ...data } = template;
    const existing = await prisma.blendTemplate.findUnique({ where: { slug: data.slug } });
    if (!existing) {
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
  }

  console.log('\n🎉 Seed complete!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
