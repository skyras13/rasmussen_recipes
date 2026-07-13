import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { PrismaClient, Visibility, Difficulty } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { gradientPng, type Rgb } from './placeholder-png'

const prisma = new PrismaClient()

const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR ?? './uploads')
const PASSWORD = 'password123'

const PALETTES: Array<[Rgb, Rgb]> = [
  [
    [244, 162, 97],
    [231, 111, 81],
  ],
  [
    [233, 196, 106],
    [244, 162, 97],
  ],
  [
    [42, 157, 143],
    [38, 70, 83],
  ],
  [
    [231, 111, 81],
    [156, 44, 34],
  ],
  [
    [188, 108, 37],
    [96, 60, 20],
  ],
  [
    [106, 153, 78],
    [56, 102, 65],
  ],
]

async function coverImage(index: number): Promise<string> {
  const [top, bottom] = PALETTES[index % PALETTES.length]
  const name = `${randomUUID()}.png`
  await mkdir(UPLOAD_DIR, { recursive: true })
  await writeFile(
    path.join(UPLOAD_DIR, name),
    gradientPng(800, 800, top, bottom),
  )
  return `/api/uploads/${name}`
}

type SeedRecipe = {
  title: string
  description: string
  story?: string
  originalAuthor?: string
  originEra?: string
  servings: number
  prepMin: number
  cookMin: number
  difficulty: Difficulty
  cuisine: string
  tags: string[]
  visibility: Visibility
  ingredients: Array<{
    quantity?: number
    unit?: string
    item: string
    note?: string
  }>
  steps: string[]
}

const RECIPES: Record<string, SeedRecipe[]> = {
  sky: [
    {
      title: "Grandma Ruth's Æbleskiver",
      description:
        'Fluffy Danish pancake balls, crisp outside and custardy inside.',
      story:
        'Grandma Ruth made these every Christmas morning in her cast-iron æbleskiver pan, brought over from Denmark in 1958. The trick, she said, is turning them with a knitting needle.',
      originalAuthor: 'Ruth Rasmussen',
      originEra: '1960s',
      servings: 4,
      prepMin: 20,
      cookMin: 25,
      difficulty: Difficulty.MEDIUM,
      cuisine: 'Danish',
      tags: ['breakfast', 'holiday', 'heirloom'],
      visibility: Visibility.PUBLIC,
      ingredients: [
        {
          quantity: 2,
          unit: 'cups',
          item: 'all-purpose flour',
          note: 'sifted',
        },
        { quantity: 2, unit: 'tsp', item: 'baking powder' },
        { quantity: 1, unit: 'tbsp', item: 'sugar' },
        { quantity: 0.5, unit: 'tsp', item: 'salt' },
        { quantity: 2, item: 'eggs', note: 'separated' },
        { quantity: 2, unit: 'cups', item: 'buttermilk' },
        { quantity: 4, unit: 'tbsp', item: 'butter', note: 'melted' },
        { item: 'powdered sugar and jam', note: 'for serving' },
      ],
      steps: [
        'Whisk the flour, baking powder, sugar, and salt in a large bowl.',
        'Beat the egg yolks with the buttermilk and melted butter, then stir into the dry ingredients until just combined.',
        'Whip the egg whites to stiff peaks and fold them in gently.',
        'Heat an æbleskiver pan over medium heat and butter each well. Fill each well ¾ full.',
        'When the edges set, rotate each ball a quarter turn with a skewer. Keep turning until golden all over and cooked through, about 5 minutes.',
        'Dust with powdered sugar and serve hot with raspberry jam.',
      ],
    },
    {
      title: 'Frikadeller (Danish Meatballs)',
      description: 'Pan-fried pork meatballs, the Rasmussen Sunday standby.',
      story:
        'Dad made these every Sunday after church, always with brown gravy and boiled potatoes. He never measured anything — this is our best reconstruction.',
      originalAuthor: 'Erik Rasmussen',
      originEra: '1980s',
      servings: 6,
      prepMin: 15,
      cookMin: 20,
      difficulty: Difficulty.EASY,
      cuisine: 'Danish',
      tags: ['dinner', 'heirloom', 'comfort food'],
      visibility: Visibility.PUBLIC,
      ingredients: [
        { quantity: 1, unit: 'lb', item: 'ground pork' },
        { quantity: 0.5, unit: 'lb', item: 'ground veal', note: 'or beef' },
        { quantity: 1, item: 'onion', note: 'finely grated' },
        { quantity: 1, item: 'egg' },
        { quantity: 0.5, unit: 'cup', item: 'breadcrumbs' },
        { quantity: 0.5, unit: 'cup', item: 'milk' },
        { quantity: 1, unit: 'tsp', item: 'salt' },
        { quantity: 0.5, unit: 'tsp', item: 'black pepper' },
        { quantity: 3, unit: 'tbsp', item: 'butter', note: 'for frying' },
      ],
      steps: [
        'Mix all ingredients except the butter and let the mixture rest 15 minutes so the breadcrumbs hydrate.',
        'Form oval meatballs with two spoons dipped in cold water.',
        'Fry in butter over medium heat, 4–5 minutes per side, until deep brown and cooked through.',
        'Serve with boiled potatoes, brown gravy, and pickled red cabbage.',
      ],
    },
    {
      title: 'Secret-Ingredient Chili',
      description:
        'The chili I bring to every potluck. The secret stays secret.',
      servings: 8,
      prepMin: 20,
      cookMin: 90,
      difficulty: Difficulty.EASY,
      cuisine: 'American',
      tags: ['dinner', 'potluck'],
      visibility: Visibility.PRIVATE,
      ingredients: [
        { quantity: 2, unit: 'lb', item: 'ground beef' },
        { quantity: 2, item: 'onions', note: 'diced' },
        { quantity: 4, unit: 'cloves', item: 'garlic' },
        { quantity: 2, unit: 'cans', item: 'kidney beans' },
        { quantity: 28, unit: 'oz', item: 'crushed tomatoes' },
        { quantity: 3, unit: 'tbsp', item: 'chili powder' },
        {
          quantity: 1,
          unit: 'square',
          item: 'dark chocolate',
          note: 'the secret',
        },
      ],
      steps: [
        'Brown the beef with the onions and garlic.',
        'Add everything else and simmer low for 90 minutes, stirring now and then.',
        'Take off the heat and stir in the chocolate. Tell no one.',
      ],
    },
  ],
  astrid: [
    {
      title: 'Rødgrød med Fløde',
      description:
        'Danish red berry pudding with cream — say it three times fast.',
      story:
        'The dessert every Dane makes visitors try to pronounce. Aunt Astrid serves it in August when the currants come in.',
      servings: 6,
      prepMin: 10,
      cookMin: 15,
      difficulty: Difficulty.EASY,
      cuisine: 'Danish',
      tags: ['dessert', 'summer', 'heirloom'],
      visibility: Visibility.PUBLIC,
      ingredients: [
        { quantity: 1, unit: 'lb', item: 'strawberries', note: 'hulled' },
        { quantity: 0.5, unit: 'lb', item: 'raspberries' },
        { quantity: 0.5, unit: 'lb', item: 'red currants' },
        { quantity: 0.75, unit: 'cup', item: 'sugar' },
        { quantity: 3, unit: 'tbsp', item: 'cornstarch' },
        { quantity: 1, unit: 'cup', item: 'heavy cream', note: 'for serving' },
      ],
      steps: [
        'Simmer the berries with the sugar and a splash of water until they collapse, about 10 minutes.',
        'Whisk the cornstarch with cold water, stir in, and simmer until glossy and thick.',
        'Chill completely. Serve in bowls with cold cream poured over.',
      ],
    },
    {
      title: 'Cardamom Braid (Kardemommekrans)',
      description: 'Fragrant cardamom bread for fika, braided the family way.',
      servings: 10,
      prepMin: 30,
      cookMin: 25,
      difficulty: Difficulty.HARD,
      cuisine: 'Scandinavian',
      tags: ['baking', 'coffee', 'family'],
      visibility: Visibility.FAMILY,
      ingredients: [
        { quantity: 4, unit: 'cups', item: 'bread flour' },
        { quantity: 1, unit: 'cup', item: 'warm milk' },
        { quantity: 2.25, unit: 'tsp', item: 'instant yeast' },
        { quantity: 0.5, unit: 'cup', item: 'sugar' },
        {
          quantity: 2,
          unit: 'tsp',
          item: 'ground cardamom',
          note: 'freshly ground',
        },
        { quantity: 6, unit: 'tbsp', item: 'soft butter' },
        { quantity: 1, item: 'egg', note: 'for the wash' },
        { item: 'pearl sugar', note: 'for topping' },
      ],
      steps: [
        'Knead everything except the egg wash and pearl sugar into a soft dough; rise 1 hour.',
        'Divide into three ropes and braid, then shape into a wreath on a lined sheet.',
        'Proof 45 minutes, brush with egg, scatter pearl sugar.',
        'Bake at 375°F (190°C) for 22–25 minutes until deep golden.',
      ],
    },
    {
      title: 'Weeknight Lemon Chicken',
      description:
        'One-pan lemon chicken thighs I make more than anything else.',
      servings: 4,
      prepMin: 10,
      cookMin: 35,
      difficulty: Difficulty.EASY,
      cuisine: 'Mediterranean',
      tags: ['dinner', 'weeknight', 'one-pan'],
      visibility: Visibility.PUBLIC,
      ingredients: [
        { quantity: 8, item: 'chicken thighs', note: 'bone-in, skin-on' },
        { quantity: 2, item: 'lemons', note: 'one juiced, one sliced' },
        { quantity: 4, unit: 'cloves', item: 'garlic', note: 'smashed' },
        { quantity: 2, unit: 'tbsp', item: 'olive oil' },
        { quantity: 1, unit: 'tsp', item: 'dried oregano' },
        { quantity: 1, unit: 'cup', item: 'chicken stock' },
      ],
      steps: [
        'Sear the thighs skin-side down in olive oil until deeply golden; flip and remove.',
        'Sauté the garlic, then add stock, lemon juice, lemon slices, and oregano, scraping the pan.',
        'Return the chicken skin-side up and roast at 400°F (200°C) for 25 minutes.',
      ],
    },
  ],
  soren: [
    {
      title: 'Smørrebrød Three Ways',
      description:
        'Open-faced rye sandwiches: pickled herring, egg & shrimp, roast beef.',
      servings: 3,
      prepMin: 25,
      cookMin: 0,
      difficulty: Difficulty.MEDIUM,
      cuisine: 'Danish',
      tags: ['lunch', 'tradition'],
      visibility: Visibility.PUBLIC,
      ingredients: [
        { quantity: 6, unit: 'slices', item: 'rugbrød (Danish rye)' },
        { quantity: 4, unit: 'tbsp', item: 'butter', note: 'good and cold' },
        { quantity: 6, unit: 'pieces', item: 'pickled herring' },
        { quantity: 3, item: 'eggs', note: 'soft-boiled' },
        { quantity: 0.5, unit: 'lb', item: 'small shrimp', note: 'cooked' },
        { quantity: 6, unit: 'slices', item: 'rare roast beef' },
        { item: 'remoulade, dill, capers, crispy onions', note: 'to garnish' },
      ],
      steps: [
        'Butter the rye all the way to the edges — this is non-negotiable.',
        'Build the herring boards with onion rings and dill.',
        'Layer egg slices and shrimp on the second pair; roast beef with remoulade and crispy onions on the third.',
        'Serve with cold beer and eat with a knife and fork.',
      ],
    },
    {
      title: 'Midnight Ramen Hack',
      description: 'Instant ramen upgraded with pantry staples in 10 minutes.',
      servings: 1,
      prepMin: 5,
      cookMin: 5,
      difficulty: Difficulty.EASY,
      cuisine: 'Japanese-ish',
      tags: ['late night', 'student food'],
      visibility: Visibility.PUBLIC,
      ingredients: [
        { quantity: 1, unit: 'pack', item: 'instant ramen' },
        { quantity: 1, item: 'egg' },
        { quantity: 1, unit: 'tbsp', item: 'peanut butter' },
        { quantity: 1, unit: 'tsp', item: 'soy sauce' },
        { quantity: 1, unit: 'tsp', item: 'chili crisp' },
        { quantity: 1, item: 'scallion', note: 'sliced' },
      ],
      steps: [
        'Cook the noodles one minute short of the package time.',
        'Whisk the seasoning packet, peanut butter, soy sauce, and chili crisp into the broth.',
        'Slide in the egg to poach for the last 90 seconds. Top with scallions.',
      ],
    },
  ],
}

async function main() {
  const emails = ['sky@example.com', 'astrid@example.com', 'soren@example.com']
  await prisma.user.deleteMany({ where: { email: { in: emails } } })
  await prisma.family.deleteMany({ where: { slug: 'rasmussen' } })

  const passwordHash = await bcrypt.hash(PASSWORD, 12)

  const [sky, astrid, soren] = await Promise.all([
    prisma.user.create({
      data: {
        email: 'sky@example.com',
        name: 'Sky Rasmussen',
        username: 'sky',
        bio: 'Keeper of the family recipe box.',
        passwordHash,
      },
    }),
    prisma.user.create({
      data: {
        email: 'astrid@example.com',
        name: 'Astrid Rasmussen',
        username: 'astrid',
        bio: 'If it has cardamom in it, I made it.',
        passwordHash,
      },
    }),
    prisma.user.create({
      data: {
        email: 'soren@example.com',
        name: 'Søren Rasmussen',
        username: 'soren',
        bio: 'Smørrebrød evangelist.',
        passwordHash,
      },
    }),
  ])

  const family = await prisma.family.create({
    data: {
      name: 'Rasmussen Family',
      slug: 'rasmussen',
      about: 'Four generations of Danish-American cooking.',
      members: {
        create: [
          { userId: sky.id, role: 'ADMIN' },
          { userId: astrid.id, role: 'MEMBER' },
          { userId: soren.id, role: 'MEMBER' },
        ],
      },
    },
  })

  const authors = { sky, astrid, soren }
  const createdRecipes: Array<{ id: string; authorId: string }> = []
  let imageIndex = 0
  for (const [key, recipes] of Object.entries(RECIPES)) {
    const author = authors[key as keyof typeof authors]
    for (const recipe of recipes) {
      const url = await coverImage(imageIndex++)
      const created = await prisma.recipe.create({
        data: {
          authorId: author.id,
          familyId:
            recipe.tags.includes('heirloom') ||
            recipe.visibility === Visibility.FAMILY
              ? family.id
              : null,
          title: recipe.title,
          description: recipe.description,
          story: recipe.story,
          originalAuthor: recipe.originalAuthor,
          originEra: recipe.originEra,
          servings: recipe.servings,
          prepMin: recipe.prepMin,
          cookMin: recipe.cookMin,
          difficulty: recipe.difficulty,
          cuisine: recipe.cuisine,
          tags: recipe.tags,
          visibility: recipe.visibility,
          publishedAt:
            recipe.visibility === Visibility.PRIVATE ? null : new Date(),
          ingredients: {
            create: recipe.ingredients.map((row, i) => ({
              quantity: row.quantity ?? null,
              unit: row.unit ?? null,
              item: row.item,
              note: row.note ?? null,
              sortOrder: i,
            })),
          },
          steps: {
            create: recipe.steps.map((text, i) => ({ text, sortOrder: i })),
          },
          images: { create: [{ url, isCover: true }] },
        },
      })
      createdRecipes.push({ id: created.id, authorId: created.authorId })
    }
  }

  // A little social life so the feed demos well: everyone follows each
  // other, and public recipes get some likes and comments.
  const users = [sky, astrid, soren]
  await prisma.follow.createMany({
    data: users.flatMap((follower) =>
      users
        .filter((followee) => followee.id !== follower.id)
        .map((followee) => ({
          followerId: follower.id,
          followeeId: followee.id,
        })),
    ),
  })

  await prisma.like.createMany({
    data: createdRecipes.flatMap((recipe) =>
      users
        .filter((user) => user.id !== recipe.authorId)
        .map((user) => ({ userId: user.id, recipeId: recipe.id })),
    ),
  })

  const aebleskiver = createdRecipes[0]
  await prisma.comment.createMany({
    data: [
      {
        userId: astrid.id,
        recipeId: aebleskiver.id,
        text: 'The knitting needle trick is real — nothing else turns them as cleanly.',
      },
      {
        userId: soren.id,
        recipeId: aebleskiver.id,
        text: 'Made these last Sunday. Gone in eleven minutes flat.',
      },
    ],
  })

  const total = await prisma.recipe.count()
  console.log(
    `Seeded 3 users (password: ${PASSWORD}), 1 family, ${total} recipes, follows/likes/comments.`,
  )
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
