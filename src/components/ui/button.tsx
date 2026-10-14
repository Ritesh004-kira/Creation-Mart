// Adapted from JobHorizons, MIT, commit 3795b35384fa6fb29cd84d3e3e51a83b3ef9366f.
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { clsx } from 'clsx';
export const buttonVariants=cva('button',{
  variants:{variant:{default:'button-primary',secondary:'button-secondary',destructive:'button-destructive',link:'button-link'},size:{default:'',sm:'button-small'}},
  defaultVariants:{variant:'default',size:'default'},
});
export function Button({className,variant,size,asChild=false,loading=false,children,...props}:React.ComponentProps<'button'>&VariantProps<typeof buttonVariants>&{asChild?:boolean;loading?:boolean}) {
  const Comp=asChild?Slot:'button';
  return <Comp {...props} className={clsx(buttonVariants({variant,size}),className)} aria-busy={loading||props['aria-busy']} disabled={loading||props.disabled}>{asChild?children:<>{loading&&<span className="spinner" aria-hidden="true"/>}{children}</>}</Comp>;
}
