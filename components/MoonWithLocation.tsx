import Moon from "@/components/Moon";
import { useMoonLocationCtx } from "@/hooks/useMoonLocation";
import React from "react";

type Props = React.ComponentProps<typeof Moon>;

export default function MoonWithLocation(props: Props) {
  const { hemisphere } = useMoonLocationCtx();
  return <Moon {...props} phase="auto" hemisphere={hemisphere} />;
}
