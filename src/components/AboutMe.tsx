import { CodeIcon } from "./Home"

export const AboutMe = ()=>{
    return (
        <section id="about" className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                About Me
              </h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                I&apos;m a passionate web developer and designer with a strong
                focus on creating beautiful and functional websites. I have
                experience working with a variety of technologies, including
                React, Next.js, and Tailwind CSS.
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-2 lg:gap-12">
            <div className="flex flex-col justify-center space-y-4">
              <h3 className="text-2xl font-bold">Skills</h3>
              <ul className="grid gap-4">
                <li className="flex items-center gap-2">
                  <CodeIcon className="w-6 h-6" />
                  <span>React</span>
                </li>
                <li className="flex items-center gap-2">
                  <CodeIcon className="w-6 h-6" />
                  <span>Next.js</span>
                </li>
                <li className="flex items-center gap-2">
                  <CodeIcon className="w-6 h-6" />
                  <span>Tailwind CSS</span>
                </li>
                <li className="flex items-center gap-2">
                  <CodeIcon className="w-6 h-6" />
                  <span>JavaScript</span>
                </li>
                <li className="flex items-center gap-2">
                  <CodeIcon className="w-6 h-6" />
                  <span>HTML/CSS</span>
                </li>
                <li className="flex items-center gap-2">
                  <CodeIcon className="w-6 h-6" />
                  <span>Git</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    )
}