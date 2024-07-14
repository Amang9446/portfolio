export const Footer = () => {
  return (
    <footer className="flex justify-center flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
      <p className="text-xs text-muted-foreground">
        &copy; {new Date().getFullYear() } Aman Gupta. All rights reserved.
      </p>
    </footer>
  );
};
