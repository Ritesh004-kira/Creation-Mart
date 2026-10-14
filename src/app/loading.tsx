'use client';
import { usePathname } from 'next/navigation';
import { LoadingState } from '@/components/ui/spinner';

export default function Loading(){
  const pathname=usePathname();
  return pathname==='/'?<div className="landing landing-loading"><LoadingState label="Loading Creation Mart…"/></div>:<LoadingState/>;
}
