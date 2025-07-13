# Aman's Portfolio

A modern, responsive portfolio website built with Next.js, TypeScript, and Tailwind CSS. Features a sophisticated design with smooth animations and a configuration-driven approach for easy customization.

## 🚀 Features

- **Modern Design**: Sophisticated dark theme with gradient backgrounds and glass-morphism effects
- **Responsive Layout**: Fully responsive design that works on all devices
- **Smooth Animations**: Custom CSS animations including spotlight effects and staggered loading
- **Configuration-Driven**: All content is managed through a single configuration file
- **Component-Based**: Modular component architecture for easy maintenance
- **TypeScript**: Full type safety throughout the application
- **Performance Optimized**: Optimized images and lazy loading for better performance

## 📁 Project Structure

```
src/
├── app/
│   ├── components/
│   │   └── nav-bar.tsx          # Navigation component
│   ├── globals.css              # Global styles and animations
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Main page (now clean and simple)
├── components/
│   ├── ui/
│   │   └── icons.tsx            # Reusable SVG icons
│   ├── sections/
│   │   ├── Hero.tsx             # Hero section component
│   │   ├── Projects.tsx         # Projects section component
│   │   ├── Skills.tsx           # Skills section component
│   │   └── Contact.tsx          # Contact section component
│   ├── projects/
│   │   └── ProjectCard.tsx      # Individual project card component
│   ├── layout/
│   │   └── Footer.tsx           # Footer component
│   └── index.ts                 # Component exports
├── config/
│   └── portfolio.ts             # Main configuration file
└── lib/
    └── utils.ts                 # Utility functions
```

## ⚙️ Configuration

All portfolio content is managed through the `src/config/portfolio.ts` file. This includes:

- **Hero Section**: Name, title, description, image, and CTA buttons
- **Projects**: Project details, images, links, and descriptions
- **Skills**: Technical skills organized by category
- **Contact**: Email, social links, and availability status
- **Metadata**: SEO and site information

### Example Configuration

```typescript
export const portfolioConfig: PortfolioConfig = {
  hero: {
    name: "Aman",
    title: "A Full Stack Developer",
    subtitle: "I'm Aman, a..",
    description: "NextJs Specialist Shaping High-Impact Projects...",
    image: "https://example.com/profile.jpg",
    ctaButtons: {
      primary: { text: "Get started", href: "#projects" },
      secondary: { text: "Learn more", href: "#contact" }
    }
  },
  projects: [
    {
      id: "project-1",
      title: "Project Name",
      description: "Project description...",
      image: "https://example.com/project.jpg",
      demoUrl: "https://demo.com",
      githubUrl: "https://github.com/user/project",
      tags: ["Next.js", "TypeScript"]
    }
  ],
  // ... more configuration
};
```

## 🎨 Design Features

### Animations
- **Spotlight Effect**: Animated spotlight overlay on hero section
- **Staggered Loading**: Projects and sections appear with delays
- **Hover Effects**: Smooth transitions on interactive elements
- **Gradient Backgrounds**: Dynamic gradient overlays

### Components
- **Hero Section**: Gradient backgrounds, spotlight animation, responsive layout
- **Project Cards**: Glass-morphism design with hover effects
- **Skills Display**: Organized skill categories with interactive badges
- **Contact Section**: Email copy functionality and social links

## 🛠️ Technologies Used

- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **CSS Animations**: Custom keyframe animations
- **Responsive Design**: Mobile-first approach

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd portfolio-front-end
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Customize the configuration**
   - Edit `src/config/portfolio.ts` with your information
   - Update images, links, and content as needed

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   - Navigate to `http://localhost:3000`

## 📝 Customization

### Adding New Projects
1. Add project details to the `projects` array in `portfolio.ts`
2. Include project image, description, and links
3. The component will automatically render the new project

### Modifying Skills
1. Update the `skills` array in `portfolio.ts`
2. Categorize skills as either 'tech' or 'tools'
3. Skills will be automatically organized and displayed

### Changing Colors and Theme
1. Modify CSS variables in `src/app/globals.css`
2. Update Tailwind configuration for custom colors
3. All components use CSS variables for consistent theming

### Adding New Sections
1. Create a new component in `src/components/sections/`
2. Add the section to the main page
3. Include any necessary configuration in `portfolio.ts`

## 🎯 Key Benefits

- **Easy Maintenance**: All content in one configuration file
- **Scalable**: Modular component architecture
- **Performance**: Optimized images and lazy loading
- **Accessibility**: Proper ARIA labels and semantic HTML
- **SEO Ready**: Meta tags and structured data
- **Mobile First**: Responsive design for all devices

## 📱 Responsive Design

The portfolio is fully responsive with breakpoints for:
- Mobile: 320px - 768px
- Tablet: 768px - 1024px
- Desktop: 1024px+

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Code Style
- TypeScript for type safety
- ESLint for code quality
- Prettier for code formatting
- Component-based architecture

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

Built with ❤️ by Aman using Next.js and modern web technologies.
