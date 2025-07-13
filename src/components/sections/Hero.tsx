import Image from "next/image";
import { HeroConfig } from "@/config/portfolio";

interface HeroProps {
  config: HeroConfig;
}

export default function Hero({ config }: HeroProps) {
  return (
    <div className="relative overflow-hidden py-7 lg:py-32">
      {/* Background Gradients */}
      <div
        aria-hidden="true"
        className="flex absolute -top-96 start-1/2 transform -translate-x-1/2"
      >
        <div className="bg-gradient-to-r from-background/50 to-background blur-3xl w-[25rem] h-[44rem] rotate-[-60deg] transform -translate-x-[10rem]"></div>
        <div className="bg-gradient-to-tl blur-3xl w-[90rem] h-[50rem] rounded-full origin-top-left -rotate-12 -translate-x-[15rem] from-primary-foreground via-primary-foreground to-background"></div>
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

      <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-24">
        {/* Spotlight Animation */}
        <svg
          className="animate-spotlight pointer-events-none absolute z-[1] h-[169%] w-[138%] lg:w-[84%] opacity-0 -top-20 left-0 md:left-10 md:-top-20"
          fill="none"
          viewBox="0 0 3787 2842"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g filter="url(#filter)">
            <ellipse
              cx="1924.71"
              cy="273.501"
              fill="gray"
              fillOpacity="0.21"
              rx="1924.71"
              ry="273.501"
              transform="matrix(-0.822377 -0.568943 -0.568943 0.822377 3631.88 2291.09)"
            ></ellipse>
          </g>
          <defs>
            <filter
              colorInterpolationFilters="sRGB"
              filterUnits="userSpaceOnUse"
              height="2840.26"
              id="filter"
              width="3785.16"
              x="0.860352"
              y="0.838989"
            >
              <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
              <feBlend
                in="SourceGraphic"
                in2="BackgroundImageFix"
                mode="normal"
                result="shape"
              ></feBlend>
              <feGaussianBlur
                result="effect1_foregroundBlur_1065_8"
                stdDeviation="151"
              ></feGaussianBlur>
            </filter>
          </defs>
        </svg>

        <div className="relative z-10">
          <div className="container py-10 lg:py-16">
            <div className="max-w-2xl text-center mx-auto">
              <p className="font-mono antialiased text-lg">{config.subtitle}</p>
              <div className="mt-5 max-w-2xl">
                <h1 className="scroll-m-20 text-3xl font-extrabold tracking-tight lg:text-5xl">
                  {config.title}
                </h1>
              </div>
              <div className="mt-5 max-w-3xl">
                <p className="text-sm lg:text-base text-muted-foreground font-stretch-expanded tracking-normal !leading-8">
                  {config.description.split(".").map((sentence, index) => {
                    const words = sentence.trim().split(" ");
                    const highlightedWords = words.map((word, wordIndex) => {
                      // Highlight specific keywords
                      const isHighlighted = [
                        "ReactNative",
                        "Open-Source",
                        "DSA",
                      ].some((keyword) => word.includes(keyword));

                      return (
                        <span key={wordIndex}>
                          {isHighlighted ? (
                            <span className="rounded-md bg-zinc-800 px-1.5 py-0.5 text-zinc-200">
                              {word}
                            </span>
                          ) : (
                            word
                          )}
                          {wordIndex < words.length - 1 ? " " : ""}
                        </span>
                      );
                    });

                    return (
                      <span key={index}>
                        {highlightedWords}
                        {index < config.description.split(".").length - 1 && (
                          <>
                            .
                            <br className="block sm:hidden" />
                          </>
                        )}
                      </span>
                    );
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <Image
            alt="Hero"
            loading="lazy"
            width={300}
            height={300}
            decoding="async"
            className="w-[200px] h-[200px] lg:w-[300px] lg:h-[300px] rounded-full mx-auto"
            src={config.image}
          />
        </div>
      </div>
    </div>
  );
}
