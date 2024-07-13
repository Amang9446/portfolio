import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Textarea } from "./ui/textarea"
import { toast } from 'react-hot-toast';
import React from "react";
export const Contact = ()=>{
  const handleButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault(); 
    toast.success('Contact has been sent successfully', {
      style: {
        border: '1px solid #713200',
        padding: '16px',
        color: '#c7a26b',
      },
      iconTheme: {
        primary: '#c7a26b',
        secondary: '#ECE3D4',
      },
      duration: 5000,
    });
  };
    return (
        <section id="contact" className="w-full py-12 md:py-24 lg:py-32 bg-muted">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Contact Me</h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                I&apos;d love to hear from you! Feel free to reach out with any questions or inquiries.
              </p>
            </div>
            <div className="mx-auto w-full max-w-sm space-y-2">
              <form className="flex flex-col gap-4">
                <Input type="text" placeholder="Name" className="max-w-lg flex-1" />
                <Input type="email" placeholder="Email" className="max-w-lg flex-1" />
                <Textarea placeholder="Message" className="max-w-lg flex-1" />
                <Button onClick={handleButtonClick} className="w-full">
                  Submit
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>
    )
}