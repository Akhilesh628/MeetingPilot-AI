
import React from "react";
import {
    CalendarDays,
    Clock,
    Users,
    CheckCircle2,
    TrendingUp
} from "lucide-react";

const analytics = [
    {
        title: "Total Meetings",
        value: 12,
        subtitle: "All calendar meetings",
        icon: CalendarDays,
        color: "blue"
    },
    {
        title: "Upcoming Today",
        value: 4,
        subtitle: "Scheduled for today",
        icon: Clock,
        color: "green"
    },
    {
        title: "Total Attendees",
        value: 28,
        subtitle: "Across all meetings",
        icon: Users,
        color: "purple"
    },
    {
        title: "Completed Meetings",
        value: 8,
        subtitle: "Successfully completed",
        icon: CheckCircle2,
        color: "orange"
    }
];

export default function DashboardAnalytics({ stats }) {

    const cards = analytics.map((item) => ({
        ...item,
        value: stats?.[item.title] ?? item.value
    }));

    return (
        <section className="dashboard-analytics">

            <div className="analytics-heading">
                <div>
                    <h2>Dashboard Overview</h2>
                    <p>Your meeting activity at a glance</p>
                </div>

                <div className="analytics-live">
                    <span className="online-dot"></span>
                    Meeting Statistics
                </div>
            </div>

            <div className="analytics-grid">

                {cards.map((item) => {

                    const Icon = item.icon;

                    return (
                        <div
                            className="analytics-card"
                            key={item.title}
                        >

                            <div className="analytics-card-top">

                                <div className={`analytics-icon ${item.color}`}>
                                    <Icon size={23} />
                                </div>

                                <TrendingUp
                                    size={17}
                                    className="analytics-trend"
                                />

                            </div>

                            <h3>{item.value}</h3>

                            <h4>{item.title}</h4>

                            <p>{item.subtitle}</p>

                        </div>
                    );
                })}

            </div>

        </section>
    );
}
