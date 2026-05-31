import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function StubPage({
  tag,
  title,
  lead,
  children,
}: {
  tag: string;
  title: ReactNode;
  lead: string;
  children?: ReactNode;
}) {
  return (
    <section className="zg-stub">
      <div className="zg-stub-tag">{tag}</div>
      <h1 className="zg-h1" style={{ fontSize: "clamp(36px, 5vw, 56px)" }}>
        {title}
      </h1>
      <p className="zg-lead">{lead}</p>
      {children}
      <div className="zg-actions" style={{ marginTop: 24 }}>
        <Link to="/" className="zg-btn zg-btn-ghost">
          ← Retour à l'accueil
        </Link>
      </div>
    </section>
  );
}
