import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { name: "ינואר", חשיפות: 4000, קליקים: 2400, המרות: 240 },
  { name: "פברואר", חשיפות: 3000, קליקים: 1398, המרות: 221 },
  { name: "מרץ", חשיפות: 2000, קליקים: 9800, המרות: 290 },
  { name: "אפריל", חשיפות: 2780, קליקים: 3908, המרות: 200 },
  { name: "מאי", חשיפות: 1890, קליקים: 4800, המרות: 181 },
  { name: "יוני", חשיפות: 2390, קליקים: 3800, המרות: 250 },
  { name: "יולי", חשיפות: 3490, קליקים: 4300, המרות: 210 },
];

export function PerformanceChart() {
  return (
    <div className="glass rounded-xl p-6 card-shadow opacity-0 animate-slide-up" style={{ animationDelay: "0.25s", animationFillMode: "forwards" }}>
      <h2 className="text-xl font-bold mb-6">ביצועים כלליים</h2>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorImpressions" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 47%, 16%)" />
            <XAxis 
              dataKey="name" 
              stroke="hsl(215, 20%, 55%)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="hsl(215, 20%, 55%)"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value / 1000}K`}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: "hsl(222, 47%, 10%)",
                border: "1px solid hsl(222, 47%, 16%)",
                borderRadius: "0.75rem",
                color: "hsl(210, 40%, 98%)",
              }}
            />
            <Area
              type="monotone"
              dataKey="חשיפות"
              stroke="hsl(199, 89%, 48%)"
              fillOpacity={1}
              fill="url(#colorImpressions)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="קליקים"
              stroke="hsl(142, 71%, 45%)"
              fillOpacity={1}
              fill="url(#colorClicks)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
