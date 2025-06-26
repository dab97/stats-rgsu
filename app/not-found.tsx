"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Error404 from "@/public/error404.svg";

export default function NotFound() {
  const router = useRouter();

  return (
    <main className="flex flex-col items-center justify-center min-h-screen mx-auto gap-8">
      <Image
        src={Error404}
        alt="Error 404 page"
        style={{
          objectFit: "contain",
        }}
        width={400}
        height={400}
      />
      <h1 className="text-xl sm:text-2xl font-semibold text-[#4d5f7d] mb-4 text-center">
        Упс - Страница не найдена
      </h1>
      <Button
        onClick={() => router.push("/")}
        variant="outline"
        className="text-center"
      >
        На главную
      </Button>
    </main>
  );
}