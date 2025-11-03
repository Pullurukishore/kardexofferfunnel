"use client"

import * as React from "react"
import { Toaster as RadixToaster } from "@/components/ui/toast"

type ToasterProps = React.HTMLAttributes<HTMLDivElement>

export function Toaster(props: ToasterProps) {
  return <RadixToaster {...props} />
}
