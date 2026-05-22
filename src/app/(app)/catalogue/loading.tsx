import { TopHeader } from "@/components/ui";
import { CatalogueSkeleton } from "./_components/catalogue-skeleton";

export default function CatalogueLoading() {
  return (
    <>
      <TopHeader title="FESTIVALS" />
      <CatalogueSkeleton />
    </>
  );
}
