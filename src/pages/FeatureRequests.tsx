import { MainLayout } from "@/components/layout/MainLayout";
import { FeatureRequestsManager } from "@/components/features/FeatureRequestsManager";

export default function FeatureRequests() {
  return (
    <MainLayout>
      <div className="p-6">
        <FeatureRequestsManager />
      </div>
    </MainLayout>
  );
}
