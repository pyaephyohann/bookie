import { getHomePageData } from "@/lib/data";
import { BookPassFeature } from "@/components/landing/BookPassFeature";
import { BestSellers } from "@/components/landing/BestSellers";
import { CategoryShowcase } from "@/components/landing/CategoryShowcase";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Hero } from "@/components/landing/Hero";
import { NewReleases } from "@/components/landing/NewReleases";
import { PopularAuthors } from "@/components/landing/PopularAuthors";
import { Promotions } from "@/components/landing/Promotions";
import { ReadingFeature } from "@/components/landing/ReadingFeature";
import { RecommendedBooks } from "@/components/landing/RecommendedBooks";
import { StaffPicks } from "@/components/landing/StaffPicks";
import { TrendingBooks } from "@/components/landing/TrendingBooks";
import { RecentlyViewed } from "@/components/books/RecentlyViewed";

export default async function HomePage() {
  const data = await getHomePageData();

  return (
    <>
      <Hero floatingBooks={data.heroFloating} slides={data.heroSlides} />
      <CategoryShowcase categories={data.categories} />
      <TrendingBooks books={data.trending} />
      <BestSellers books={data.bestSellers} />
      <NewReleases books={data.newReleases} />
      <Promotions books={data.promotions} />
      <StaffPicks books={data.staffPicks} />
      <PopularAuthors authors={data.authors} />
      <RecommendedBooks books={data.recommended} />
      <RecentlyViewed books={data.books} />
      <ReadingFeature book={data.readingBook} />
      <BookPassFeature />
      <FinalCTA />
    </>
  );
}