import Link from "next/link"
import { Button } from "@/components/ui/button"
import type { ButtonProps } from "@base-ui/react/button"

export function ButtonLink({
  href,
  children,
  ...props
}: ButtonProps & { href: string; children: React.ReactNode }) {
  return (
    <Button render={<Link href={href} />} nativeButton={false} {...props}>
      {children}
    </Button>
  )
}
