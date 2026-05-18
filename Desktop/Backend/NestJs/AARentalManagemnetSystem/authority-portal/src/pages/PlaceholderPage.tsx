import { Construction } from "lucide-react";

export function PlaceholderPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-lg mx-auto text-center py-16">
      <Construction className="w-12 h-12 text-slate-300 mx-auto mb-4" />
      <h1 className="text-xl font-bold text-slate-900 mb-2">{title}</h1>
      <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
    </div>
  );
}
