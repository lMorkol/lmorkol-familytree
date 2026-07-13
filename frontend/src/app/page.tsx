"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated()) {
      router.push("/trees");
    } else {
      router.push("/login");
    }
  }, [router]);

  return <div className="text-center py-20 text-gray-500">Загрузка...</div>;
}
