export default function Home() {
  return (
    <main className='container mx-auto p-4'>
      <h1 className='text-4xl font-bold mb-4'>
        Welcome to Next.js with DaisyUI
      </h1>
      <div className='flex gap-4'>
        <button className='btn btn-primary'>Primary Button</button>
        <button className='btn btn-secondary'>Secondary Button</button>
        <button className='btn btn-accent'>Accent Button</button>
      </div>
    </main>
  )
}
