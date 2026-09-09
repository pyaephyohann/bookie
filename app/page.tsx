import { BookPassFeature } from "@/components/landing/BookPassFeature";
import { BestSellers } from "@/components/landing/BestSellers";
import { CategoryShowcase } from "@/components/landing/CategoryShowcase";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Hero } from "@/components/landing/Hero";
import { NewReleases } from "@/components/landing/NewReleases";
import { PopularAuthors } from "@/components/landing/PopularAuthors";
import { Promotions } from "@/components/landing/Promotions";
import { ReadingFeature } from "@/components/landing/ReadingFeature";
import { TrendingBooks } from "@/components/landing/TrendingBooks";

export default function HomePage() {
  return (
    <>
      <Hero />
      <TrendingBooks />
      <BestSellers />
      <NewReleases />
      <Promotions />
      <CategoryShowcase />
      <PopularAuthors />
      <ReadingFeature />
      <BookPassFeature />
      <FinalCTA />
    </>
  );
}
