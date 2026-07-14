import { redirect } from 'next/navigation'
import ScanForm from '@/components/ScanForm'
import { aiEnabled } from '@/lib/ai'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function ScanRecipe() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const families = (
    await prisma.familyMember.findMany({
      where: { userId: session.user.id },
      include: { family: { select: { id: true, name: true } } },
    })
  ).map((membership) => membership.family)

  return (
    <div className='container mx-auto p-4 max-w-3xl'>
      <h1 className='text-4xl font-bold mb-2'>📸 Scan a recipe card</h1>
      <p className='text-base-content/70 mb-6'>
        Photograph Grandma&apos;s handwritten card and it becomes a structured
        recipe — with the original card kept on the recipe forever.
      </p>
      <ScanForm families={families} enabled={aiEnabled()} />
    </div>
  )
}
