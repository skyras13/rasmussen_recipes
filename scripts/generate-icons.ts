import { writeFileSync } from 'node:fs'
import { gradientPng } from '../prisma/placeholder-png'

// One-off: PWA icons from the app's warm gradient. Re-run with
// `npx tsx scripts/generate-icons.ts` if the brand colors change.
for (const size of [192, 512]) {
  writeFileSync(
    `public/icon-${size}.png`,
    gradientPng(size, size, [244, 162, 97], [231, 111, 81]),
  )
  console.log(`public/icon-${size}.png`)
}
