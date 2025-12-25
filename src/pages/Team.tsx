import { MainLayout } from "@/components/layout/MainLayout";
import { 
  Mail, 
  Phone,
  CheckCircle2,
  Clock,
  BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  department: "design" | "content" | "ads" | "strategy" | "development";
  email: string;
  phone: string;
  avatar: string;
  tasksCompleted: number;
  tasksInProgress: number;
  performance: number;
}

const team: TeamMember[] = [
  {
    id: "1",
    name: "יעל כהן",
    role: "מעצבת גרפית בכירה",
    department: "design",
    email: "yael@company.com",
    phone: "050-1234567",
    avatar: "YK",
    tasksCompleted: 45,
    tasksInProgress: 3,
    performance: 94,
  },
  {
    id: "2",
    name: "דני לוי",
    role: "כותב תוכן",
    department: "content",
    email: "dani@company.com",
    phone: "052-9876543",
    avatar: "DL",
    tasksCompleted: 38,
    tasksInProgress: 5,
    performance: 88,
  },
  {
    id: "3",
    name: "מיכל אברהם",
    role: "מנהלת קמפיינים",
    department: "ads",
    email: "michal@company.com",
    phone: "054-5556666",
    avatar: "MA",
    tasksCompleted: 52,
    tasksInProgress: 4,
    performance: 96,
  },
  {
    id: "4",
    name: "רון שמיר",
    role: "אנליסט שיווקי",
    department: "strategy",
    email: "ron@company.com",
    phone: "053-7778888",
    avatar: "RS",
    tasksCompleted: 28,
    tasksInProgress: 2,
    performance: 91,
  },
  {
    id: "5",
    name: "נועה גולן",
    role: "מפתחת Full Stack",
    department: "development",
    email: "noa@company.com",
    phone: "058-1112222",
    avatar: "NG",
    tasksCompleted: 35,
    tasksInProgress: 6,
    performance: 89,
  },
  {
    id: "6",
    name: "אורי דוד",
    role: "מנהל פרויקטים",
    department: "strategy",
    email: "ori@company.com",
    phone: "050-3334444",
    avatar: "OD",
    tasksCompleted: 60,
    tasksInProgress: 8,
    performance: 92,
  },
];

const departmentConfig = {
  design: { color: "bg-pink-500", label: "עיצוב" },
  content: { color: "bg-blue-500", label: "תוכן" },
  ads: { color: "bg-green-500", label: "פרסום" },
  strategy: { color: "bg-purple-500", label: "אסטרטגיה" },
  development: { color: "bg-orange-500", label: "פיתוח" },
};

export default function Team() {
  return (
    <MainLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8 opacity-0 animate-fade-in" style={{ animationFillMode: "forwards" }}>
          <h1 className="text-3xl font-bold mb-2">הצוות</h1>
          <p className="text-muted-foreground">ניהול חברי צוות וביצועים</p>
        </div>

        {/* Team Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {team.map((member, index) => {
            const department = departmentConfig[member.department];
            
            return (
              <div 
                key={member.id}
                className="glass rounded-xl card-shadow opacity-0 animate-slide-up glass-hover overflow-hidden"
                style={{ animationDelay: `${0.1 + index * 0.08}s`, animationFillMode: "forwards" }}
              >
                <div className={cn("h-2", department.color)} />
                <div className="p-6">
                  {/* Avatar & Info */}
                  <div className="flex items-center gap-4 mb-6">
                    <div className={cn(
                      "w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold",
                      department.color
                    )}>
                      {member.avatar}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">{member.name}</h3>
                      <p className="text-sm text-muted-foreground">{member.role}</p>
                      <span className={cn(
                        "inline-block mt-1 px-2 py-0.5 rounded-full text-xs",
                        `${department.color}/10 text-foreground`
                      )}>
                        {department.label}
                      </span>
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="space-y-2 mb-6">
                    <a 
                      href={`mailto:${member.email}`}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Mail className="w-4 h-4" />
                      {member.email}
                    </a>
                    <a 
                      href={`tel:${member.phone}`}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Phone className="w-4 h-4" />
                      {member.phone}
                    </a>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-success mb-1">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <p className="text-xl font-bold">{member.tasksCompleted}</p>
                      <p className="text-xs text-muted-foreground">הושלמו</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-warning mb-1">
                        <Clock className="w-4 h-4" />
                      </div>
                      <p className="text-xl font-bold">{member.tasksInProgress}</p>
                      <p className="text-xs text-muted-foreground">בתהליך</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-primary mb-1">
                        <BarChart3 className="w-4 h-4" />
                      </div>
                      <p className="text-xl font-bold">{member.performance}%</p>
                      <p className="text-xs text-muted-foreground">ביצוע</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </MainLayout>
  );
}
