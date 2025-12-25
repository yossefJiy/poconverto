import { MainLayout } from "@/components/layout/MainLayout";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { TaskList } from "@/components/dashboard/TaskList";
import { CampaignOverview } from "@/components/dashboard/CampaignOverview";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import { 
  Users, 
  Target, 
  TrendingUp, 
  CheckSquare,
  Calendar
} from "lucide-react";

export default function Dashboard() {
  return (
    <MainLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8 opacity-0 animate-fade-in" style={{ animationFillMode: "forwards" }}>
          <h1 className="text-3xl font-bold mb-2">בוקר טוב! 👋</h1>
          <p className="text-muted-foreground">הנה סיכום הפעילות שלך להיום</p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="לקוחות פעילים"
            value={24}
            change={12}
            icon={<Users className="w-6 h-6" />}
            delay={0.1}
          />
          <MetricCard
            title="קמפיינים פעילים"
            value={18}
            change={8}
            icon={<Target className="w-6 h-6" />}
            delay={0.15}
          />
          <MetricCard
            title="המרות החודש"
            value="1,234"
            change={23}
            icon={<TrendingUp className="w-6 h-6" />}
            delay={0.2}
          />
          <MetricCard
            title="משימות פתוחות"
            value={47}
            change={-5}
            icon={<CheckSquare className="w-6 h-6" />}
            delay={0.25}
          />
        </div>

        {/* Charts and Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <PerformanceChart />
          <TaskList />
        </div>

        {/* Campaign Overview */}
        <CampaignOverview />
      </div>
    </MainLayout>
  );
}
