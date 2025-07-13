export interface Project {
  id: string;
  title: string;
  description: string;
  image: string;
  demoUrl?: string;
  githubUrl?: string;
  docsUrl?: string;
  tags: string[];
}

export interface Skill {
  name: string;
  category: "tech" | "tools";
}

export interface SocialLink {
  name: string;
  url: string;
  icon: string;
}

export interface HeroConfig {
  name: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
}

export interface ContactConfig {
  email: string;
  availability: string;
  responseTime: string;
  socialLinks: SocialLink[];
}

export interface PortfolioConfig {
  hero: HeroConfig;
  projects: Project[];
  skills: Skill[];
  contact: ContactConfig;
  metadata: {
    title: string;
    description: string;
    author: string;
    keywords: string[];
  };
}

export const portfolioConfig: PortfolioConfig = {
  hero: {
    name: "Aman",
    title: "A Software Engineer",
    subtitle: "I'm Aman, a..",
    description:
      "ReactNative Specialist Shaping High-Impact Projects. Open-Source Contributor with Proven Reach.",
    image:
      "https://pbs.twimg.com/profile_images/1905805359064723456/pJ1-dOHi_400x400.jpg",
  },
  projects: [
    {
      id: "Business-App",
      title: "Business App",
      description:
        "Created an app in which seller can onboard their business and get the best out of it.",
      image:
        "https://res.cloudinary.com/dul8kwnvj/image/upload/v1720977179/krfj9s3z7vrpsrommbbn.jpg",
      demoUrl: "https://github.com/Amang9446/Get-Your-Business-Live",
      githubUrl:
        "https://github.com/Amang9446/Get-Your-Business-Live?tab=readme-ov-file",
      docsUrl:
        "https://github.com/Amang9446/Get-Your-Business-Live?tab=readme-ov-file",
      tags: [
        "React Native",
        "TypeScript",
        "Expo",
        "Clerk",
        "Redux",
        "Firebase",
      ],
    },
    {
      id: "Expo-Ecommerce",
      title: "Expo Ecommerce",
      description: "Created a basic ecommerce app with minimal UI",
      image:
        "https://res.cloudinary.com/drzv3bviq/image/upload/v1734372554/vx6nirmnnybglbztaxrd.png",
      demoUrl: "https://github.com/Amang9446/Expo-Ecommerce",
      githubUrl: "https://github.com/Amang9446/Expo-Ecommerce",
      docsUrl:
        "https://github.com/Amang9446/Expo-Ecommerce/blob/main/README.md",
      tags: [
        "React Native",
        "TypeScript",
        "Expo",
        "Firebase",
        "NativeWind",
        "Zustand",
      ],
    },
    {
      id: "Expo-Notes App",
      title: "Expo Notes App",
      description:
        "Replicated a note-taking app design from X/Twitter post using React Native & Expo",
      image:
        "https://res.cloudinary.com/drzv3bviq/image/upload/v1734372554/vx6nirmnnybglbztaxrd.png",
      demoUrl: "https://x.com/Amang9446/status/1944032225856467410",
      githubUrl: "https://github.com/Amang9446/expo-notes-app",
      docsUrl:
        "https://github.com/Amang9446/expo-notes-app/blob/main/README.md",
      tags: ["React Native", "TypeScript", "Expo"],
    },
  ],
  skills: [
    // Tech skills
    { name: "React Native", category: "tech" },
    { name: "TypeScript", category: "tech" },
    { name: "Expo", category: "tech" },
    { name: "Supabase", category: "tech" },
    { name: "Firebase", category: "tech" },
    { name: "NativeWind", category: "tech" },
    { name: "Redux", category: "tech" },
    // Tools skills
    { name: "Git/GitHub", category: "tools" },
    { name: "Docker", category: "tools" },
    { name: "AWS", category: "tools" },
    { name: "GCP", category: "tools" },
    { name: "Expo Router", category: "tools" },
  ],
  contact: {
    email: "amang9446@gmail.com",
    availability: "Available",
    responseTime: "Usually responds within 24 hours",
    socialLinks: [
      {
        name: "GitHub",
        url: "https://github.com/amang9446",
        icon: "github",
      },
      {
        name: "LinkedIn",
        url: "https://linkedin.com/in/amang9446",
        icon: "linkedin",
      },
      {
        name: "Twitter",
        url: "https://twitter.com/amang9446",
        icon: "twitter",
      },
    ],
  },
  metadata: {
    title: "Aman - Software Engineer",
    description:
      "Software Engineer specializing in React Native, TypeScript, and modern mobile technologies. Building high-impact projects with proven expertise.",
    author: "Aman",
    keywords: [
      "Software Engineer",
      "React Native",
      "TypeScript",
      "Expo",
      "Supabase",
      "Firebase",
      "NativeWind",
      "Redux",
      "Git/GitHub",
      "Docker",
      "AWS",
      "Portfolio",
    ],
  },
};
