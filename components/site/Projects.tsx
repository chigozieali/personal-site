import type { ProjectContent } from "@/lib/types";

export default function Projects({ projects }: { projects: ProjectContent[] }) {
  return (
    <ul className="proj">
      {projects.map((project, index) => (
        <li key={project.id ?? index}>
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
  );
}
