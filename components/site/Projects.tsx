import type { ProjectContent } from "@/lib/types";

export default function Projects({ projects }: { projects: ProjectContent[] }) {
  const categories = new Map<string, { label: string; projects: ProjectContent[] }>();

  for (const project of projects) {
    const label = project.category?.trim() || project.type?.trim() || "Other";
    const key = label.toLowerCase();
    const category = categories.get(key);
    if (category) {
      category.projects.push(project);
    } else {
      categories.set(key, { label, projects: [project] });
    }
  }

  return (
    <div className="proj-categories">
      {[...categories.entries()].map(([key, category]) => (
        <details className="proj-category" key={key}>
          <summary>
            <span>{category.label}</span>
            <span className="count">
              {category.projects.length} project
              {category.projects.length === 1 ? "" : "s"}
            </span>
          </summary>
          <ul className="proj">
            {category.projects.map((project, index) => (
              <li key={project.id ?? `${key}-${index}`}>
                <span className="kind">
                  {project.date}
                  <br />
                  {project.type}
                </span>
                <div>
                  <h3>{project.title}</h3>
                  <p>{project.desc}</p>
                  <div className="tags">
                    {project.tags.map((tag, tagIndex) => (
                      <span key={tagIndex}>{tag}</span>
                    ))}
                  </div>
                </div>
                {project.link ? (
                  <a
                    className="go"
                    href={project.link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {project.linkLabel ?? "Open ↗"}
                  </a>
                ) : (
                  <span className="priv">{project.privateNote ?? ""}</span>
                )}
              </li>
            ))}
          </ul>
        </details>
      ))}
    </div>
  );
}
