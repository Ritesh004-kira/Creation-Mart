import Link from 'next/link';
import Image from 'next/image';
export function Footer(){return <footer className="site-footer bg-[#07080a] pt-20 pb-12 text-white"><div className="mx-auto max-w-7xl px-6 sm:px-12">
  <div className="grid gap-12 border-b border-white/10 pb-14 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1.4fr]">
    <div><Link href="/" className="inline-flex items-center gap-3 text-lg font-black text-white"><Image src="/design/logo.webp" width={30} height={30} alt=""/>Creation Mart</Link><p className="mt-4 max-w-xs text-xs leading-relaxed text-neutral-400">A creator marketplace for shared, memorable work—with the process, requirements, and usage declarations behind it.</p></div>
    <div><p className="mb-4 text-xs font-bold">Product</p><div className="flex flex-col gap-3 text-xs text-neutral-400"><Link href="/briefs/new">Brief Copilot</Link><Link href="/creators">Creator Search</Link><Link href="/briefs">Production Briefs</Link><Link href="/dashboard">Your Workspace</Link></div></div>
    <div><p className="mb-4 text-xs font-bold">Explore</p><div className="flex flex-col gap-3 text-xs text-neutral-400"><Link href="/#proof">Production Passports</Link><Link href="/#how-it-works">Creator &amp; Brand Guide</Link><Link href="/#rights">Rights Receipts</Link><Link href="/about">About this platform</Link></div></div>
    <div><p className="mb-4 text-xs font-bold">Platform</p><div className="flex flex-col gap-3 text-xs text-neutral-400"><Link href="/about">About Creation Mart</Link><Link href="/privacy">Data visibility</Link><Link href="/terms">Terms &amp; rights</Link></div></div>
    <div><p className="mb-4 text-xs font-bold">Make your next idea happen.</p><p className="text-xs leading-relaxed text-neutral-400">Publish your creative process or find a production fit for your next brief.</p><Link href="/onboarding" className="mt-5 inline-flex rounded-full border border-white/20 px-6 py-3 text-xs font-bold text-white">JOIN THE WORKSPACE →</Link></div>
  </div><div className="flex flex-col justify-between gap-4 pt-8 text-xs text-neutral-400 sm:flex-row"><p>© {new Date().getUTCFullYear()} Creation Mart</p><p>Production passports · Explainable fit · Rights receipts</p><div className="flex gap-5"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div></div>
</div></footer>;}

