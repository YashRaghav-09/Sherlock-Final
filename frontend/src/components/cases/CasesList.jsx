import CaseCard from "./CaseCard";

const cases = [
  {
    id: "SB-2026-1045",
    type: "Missing Person",
    person: "Rahul Sharma",
    officer: "Inspector Singh",
    location: "Sector 17",
    priority: "HIGH",
    updated: "12 min ago",
  },
  {
    id: "SB-2026-1088",
    type: "Vehicle Theft",
    person: "UP32 AB 4589",
    officer: "Officer Verma",
    location: "NH-48",
    priority: "MEDIUM",
    updated: "28 min ago",
  },
  {
    id: "SB-2026-1102",
    type: "Wanted Criminal",
    person: "Rakesh Kumar",
    officer: "ACP Mehra",
    location: "Old Delhi",
    priority: "HIGH",
    updated: "5 min ago",
  },
  {
    id: "SB-2026-1115",
    type: "Cyber Crime",
    person: "Financial Fraud",
    officer: "Cyber Cell",
    location: "Lucknow",
    priority: "LOW",
    updated: "1 hour ago",
  },
];

export default function CasesList() {
  return (
    <div className="space-y-5">
      {cases.map((item) => (
        <CaseCard key={item.id} {...item} />
      ))}
    </div>
  );
}