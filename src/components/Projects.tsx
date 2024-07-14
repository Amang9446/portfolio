import Image from "next/image";
import Link from "next/link";

const projectData = [
  {
    id: 1,
    href: "https://github.com/Amang9446/Get-Your-Business-Live?tab=readme-ov-file",
    src: "https://res.cloudinary.com/dul8kwnvj/image/upload/v1720982131/pawpmsxmnje9rkugjav2.png",
    alt: "Get your Business Live",
    title: "Get your Business Live",
    description: "A mobile app made using ReactNative and Expo",
  },
  {
    id: 2,
    href: "https://amang9446.github.io/QR-Code-Generator/",
    src: "https://res.cloudinary.com/dul8kwnvj/image/upload/v1720931430/piphlxuck9maaqfylhjk.png",
    alt: "Qr Code Generator",
    title: "Qr Code Generator",
    description: "A sleek qr code generator website made with React",
  },
  {
    id: 3,
    href: "https://github.com/Amang9446/NER-EVOLUTION",
    src: "https://res.cloudinary.com/dul8kwnvj/image/upload/v1720979141/exri4mm1upg9q8tgwz3x.png",
    alt: "NER Evolution",
    title: "NER+ Evolution",
    description: "Developed a named entity recognition model using spaCy",
  },
  {
    id: 4,
    href: "https://amang9446.github.io/About-Aman/",
    src: "https://res.cloudinary.com/dul8kwnvj/image/upload/v1720981118/zzs3vbbxxsrcvdho8kws.png",
    alt: "About Page",
    title: "About Aman",
    description: "A minimal about page made  using HTML and CSS",
  },
  {
    id: 5,
    href: "https://github.com/Amang9446/Tic-Tac-Toe",
    src: "https://res.cloudinary.com/dul8kwnvj/image/upload/v1720980519/ig5sswjexrww1mfn8oe8.png",
    alt: "Tic Tac Toe",
    title: "Tic Tac Toe",
    description: "A simple sleek Tick Tack Toe game made using HTML and CSS",
  },
];

export const Projects = ({ id }: { id: string }) => {
  return (
    <section
      id={id}
      className="w-full py-12 md:py-24 lg:py-32 bg-muted flex justify-center"
    >
      <div className=" container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
              My Projects
            </h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Check out some of the projects I&apos;ve worked on.
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 py-12 sm:grid-cols-2 md:gap-12 lg:grid-cols-3">
          {projectData.map((project) => (
            <div
              key={project.id}
              className="relative overflow-hidden transition-transform duration-300 ease-in-out rounded-lg shadow-lg group hover:shadow-xl hover:-translate-y-3"
            >
              <Link
                href={project.href}
                className="absolute inset-0 z-10"
                prefetch={false}
                target="_blank"
              >
                <span className="sr-only">View Project</span>
              </Link>
              <Image
                src={project.src}
                width={500}
                height={400}
                alt={project.alt}
                // className="object-cover w-full h-64"
              />
              <div className="p-4 bg-background">
                <h3 className="text-xl font-bold">{project.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {project.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
