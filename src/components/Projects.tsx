import Image from "next/image";
import Link from "next/link";

export const Projects = () => {
  return (
    <section id="projects" className="w-full py-12 md:py-24 lg:py-32 bg-muted">
      <div className="container px-4 md:px-6">
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
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 py-12 sm:grid-cols-2 md:gap-12 lg:grid-cols-3">
          <div className="relative overflow-hidden transition-transform duration-300 ease-in-out rounded-lg shadow-lg group hover:shadow-xl hover:-translate-y-2">
            <Link href="#" className="absolute inset-0 z-10" prefetch={false}>
              <span className="sr-only">View Project</span>
            </Link>
            <Image
              src="/placeholder.svg"
              width={500}
              height={400}
              alt="Project 1"
              className="object-cover w-full h-64"
            />
            <div className="p-4 bg-background">
              <h3 className="text-xl font-bold">Project 1</h3>
              <p className="text-sm text-muted-foreground">
                A modern and responsive website for a tech company.
              </p>
            </div>
          </div>
          <div className="relative overflow-hidden transition-transform duration-300 ease-in-out rounded-lg shadow-lg group hover:shadow-xl hover:-translate-y-2">
            <Link href="#" className="absolute inset-0 z-10" prefetch={false}>
              <span className="sr-only">View Project</span>
            </Link>
            <Image
              src="/placeholder.svg"
              width={500}
              height={400}
              alt="Project 2"
              className="object-cover w-full h-64"
            />
            <div className="p-4 bg-background">
              <h3 className="text-xl font-bold">Project 2</h3>
              <p className="text-sm text-muted-foreground">
                A sleek and modern e-commerce website.
              </p>
            </div>
          </div>
          <div className="relative overflow-hidden transition-transform duration-300 ease-in-out rounded-lg shadow-lg group hover:shadow-xl hover:-translate-y-2">
            <Link href="#" className="absolute inset-0 z-10" prefetch={false}>
              <span className="sr-only">View Project</span>
            </Link>
            <Image
              src="/placeholder.svg"
              width={500}
              height={400}
              alt="Project 3"
              className="object-cover w-full h-64"
            />
            <div className="p-4 bg-background">
              <h3 className="text-xl font-bold">Project 3</h3>
              <p className="text-sm text-muted-foreground">
                A responsive and user-friendly blog website.
              </p>
            </div>
          </div>
          <div className="relative overflow-hidden transition-transform duration-300 ease-in-out rounded-lg shadow-lg group hover:shadow-xl hover:-translate-y-2">
            <Link href="#" className="absolute inset-0 z-10" prefetch={false}>
              <span className="sr-only">View Project</span>
            </Link>
            <Image
              src="/placeholder.svg"
              width={500}
              height={400}
              alt="Project 4"
              className="object-cover w-full h-64"
            />
            <div className="p-4 bg-background">
              <h3 className="text-xl font-bold">Project 4</h3>
              <p className="text-sm text-muted-foreground">
                A modern and intuitive dashboard for a SaaS application.
              </p>
            </div>
          </div>
          <div className="relative overflow-hidden transition-transform duration-300 ease-in-out rounded-lg shadow-lg group hover:shadow-xl hover:-translate-y-2">
            <Link href="#" className="absolute inset-0 z-10" prefetch={false}>
              <span className="sr-only">View Project</span>
            </Link>
            <Image
              src="/placeholder.svg"
              width={500}
              height={400}
              alt="Project 5"
              className="object-cover w-full h-64"
            />
            <div className="p-4 bg-background">
              <h3 className="text-xl font-bold">Project 5</h3>
              <p className="text-sm text-muted-foreground">
                A clean and modern landing page for a startup.
              </p>
            </div>
          </div>
          <div className="relative overflow-hidden transition-transform duration-300 ease-in-out rounded-lg shadow-lg group hover:shadow-xl hover:-translate-y-2">
            <Link href="#" className="absolute inset-0 z-10" prefetch={false}>
              <span className="sr-only">View Project</span>
            </Link>
            <Image
              src="/placeholder.svg"
              width={500}
              height={400}
              alt="Project 6"
              className="object-cover w-full h-64"
            />
            <div className="p-4 bg-background">
              <h3 className="text-xl font-bold">Project 6</h3>
              <p className="text-sm text-muted-foreground">
                A responsive and accessible web application for a non-profit.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
