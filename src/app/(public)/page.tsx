import { Hero } from "@/components/home/Hero";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";

export const revalidate = 3600;

export default function HomePage() {
  return (
    <>
      <Hero />
      <FeaturedProducts />
    </>
  );
}
